/*
 * ESP32 XBee NTRIP Server 3
 *
 * Copyright (c) 2020 Nebojša Cvetković
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include "esp_log.h"
#include "esp_ota_ops.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "lwip/sockets.h"
#include "lwip/netdb.h"
#include "lwip/dns.h"
#include "cJSON.h"

#include "config.h"
#include "interface/ntrip.h"
#include "log.h"
#include "retry.h"
#include "status_led.h"
#include "stream_stats.h"
#include "tasks.h"
#include "uart.h"
#include "util.h"
#include "wifi.h"

static const char *TAG = "NTRIP_SERVER_3";

#define BUFFER_SIZE 1024
#define DATA_READY_BIT BIT0
#define CASTER_READY_BIT BIT1
#define DATA_SENT_BIT BIT2

static TaskHandle_t server_task = NULL;
static TaskHandle_t sleep_task = NULL;
static EventGroupHandle_t server_event_group = NULL;
static int sock = -1;
static status_led_handle_t status_led = NULL;
static stream_stats_handle_t stream_stats = NULL;

static void ntrip_server_sleep_task(void *ctx) {
    while (true) {
        vTaskDelay(pdMS_TO_TICKS(NTRIP_KEEP_ALIVE_THRESHOLD / 10));
    }
}

static void ntrip_server_task(void *ctx) {
    server_event_group = xEventGroupCreate();
    uart_register_read_handler(ntrip_server_uart_handler);
    xTaskCreate(ntrip_server_sleep_task, "ntrip_server_sleep_task", 2048, NULL, TASK_PRIORITY_INTERFACE, &sleep_task);

    config_color_t status_led_color = config_get_color(CONF_ITEM(KEY_CONFIG_NTRIP_SERVER_3_COLOR));
    if (status_led_color.rgba != 0) status_led = status_led_add(status_led_color.rgba, STATUS_LED_FADE, 500, 2000, 0);
    if (status_led != NULL) status_led->active = false;

    stream_stats = stream_stats_new("ntrip_server_3");

    retry_delay_handle_t delay_handle = retry_init(true, 5, 2000, 0);

    while (true) {
        retry_delay(delay_handle);

        // Wait for data to be available
        if ((xEventGroupGetBits(server_event_group) & DATA_READY_BIT) == 0) {
            ESP_LOGI(TAG, "Waiting for UART input to connect to caster");
            uart_nmea("$PESP,NTRIP,SRV3,WAITING");
            xEventGroupWaitBits(server_event_group, DATA_READY_BIT, true, false, portMAX_DELAY);
        }

        vTaskResume(sleep_task);

        wait_for_ip();

        char *buffer = NULL;

        char *host, *mountpoint, *password;
        uint16_t port = config_get_u16(CONF_ITEM(KEY_CONFIG_NTRIP_SERVER_3_PORT));
        config_get_primitive(CONF_ITEM(KEY_CONFIG_NTRIP_SERVER_3_PORT), &port);
        config_get_str_blob_alloc(CONF_ITEM(KEY_CONFIG_NTRIP_SERVER_3_HOST), (void **) &host);
        config_get_str_blob_alloc(CONF_ITEM(KEY_CONFIG_NTRIP_SERVER_3_PASSWORD), (void **) &password);
        config_get_str_blob_alloc(CONF_ITEM(KEY_CONFIG_NTRIP_SERVER_3_MOUNTPOINT), (void **) &mountpoint);

        // Auto-generate mountpoint from MAC address if empty
        if (strlen(mountpoint) == 0) {
            uint8_t mac[6];
            esp_wifi_get_mac(ESP_IF_WIFI_AP, mac);
            char generated_mountpoint[32];
            snprintf(generated_mountpoint, sizeof(generated_mountpoint), "%02X%02X%02X%02X%02X%02X",
                    mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
            
            // Free the old mountpoint and allocate new one
            free(mountpoint);
            mountpoint = strdup(generated_mountpoint);
            
            // Save the generated mountpoint to config
            config_set_str(KEY_CONFIG_NTRIP_SERVER_3_MOUNTPOINT, generated_mountpoint);
            
            ESP_LOGI(TAG, "Auto-generated mountpoint from MAC: %s", generated_mountpoint);
        }

        ESP_LOGI(TAG, "Connecting to %s:%d/%s", host, port, mountpoint);
        uart_nmea("$PESP,NTRIP,SRV3,CONNECTING,%s:%d,%s", host, port, mountpoint);
        sock = connect_socket(host, port, SOCK_STREAM);
        ERROR_ACTION(TAG, sock == CONNECT_SOCKET_ERROR_RESOLVE, goto _error, "Could not resolve host");
        ERROR_ACTION(TAG, sock == CONNECT_SOCKET_ERROR_CONNECT, goto _error, "Could not connect to host");

        buffer = malloc(BUFFER_SIZE);

        snprintf(buffer, BUFFER_SIZE, "SOURCE %s /%s" NEWLINE \
                "Source-Agent: NTRIP %s/%s" NEWLINE \
                NEWLINE, password, mountpoint, NTRIP_SERVER_NAME, &esp_ota_get_app_description()->version[1]);

        int err = write(sock, buffer, strlen(buffer));
        ERROR_ACTION(TAG, err < 0, goto _error, "Could not send request to caster: %d %s", errno, strerror(errno));

        int len = read(sock, buffer, BUFFER_SIZE - 1);
        ERROR_ACTION(TAG, len <= 0, goto _error, "Could not receive response from caster: %d %s", errno, strerror(errno));
        buffer[len] = '\0';

        char *status = extract_http_header(buffer, "");
        ERROR_ACTION(TAG, status == NULL || !ntrip_response_ok(status), free(status); goto _error,
                "Could not connect to mountpoint: %s", status == NULL ? "HTTP response malformed" : status);
        free(status);

        ESP_LOGI(TAG, "Successfully connected to %s:%d/%s", host, port, mountpoint);
        uart_nmea("$PESP,NTRIP,SRV3,CONNECTED,%s:%d,%s", host, port, mountpoint);

        retry_reset(delay_handle);

        if (status_led != NULL) status_led->active = true;

        // Connected
        xEventGroupSetBits(server_event_group, CASTER_READY_BIT);

        // Await disconnect from UART handler
        vTaskSuspend(NULL);

        // Disconnected
        xEventGroupClearBits(server_event_group, CASTER_READY_BIT | DATA_SENT_BIT);

        if (status_led != NULL) status_led->active = false;

        ESP_LOGW(TAG, "Disconnected from %s:%d/%s", host, port, mountpoint);
        uart_nmea("$PESP,NTRIP,SRV3,DISCONNECTED,%s:%d,%s", host, port, mountpoint);

        _error:
        vTaskSuspend(sleep_task);

        destroy_socket(&sock);

        free(buffer);
        free(host);
        free(mountpoint);
        free(password);
    }
}

void ntrip_server_3_init() {
    if (!config_get_bool1(CONF_ITEM(KEY_CONFIG_NTRIP_SERVER_3_ACTIVE))) return;

    xTaskCreate(ntrip_server_task, "ntrip_server_3_task", 4096, NULL, TASK_PRIORITY_INTERFACE, &server_task);
}
