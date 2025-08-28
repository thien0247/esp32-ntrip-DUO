# Quy tắc thiết kế UI - Ưu tiên hiệu suất & Classic Design

## 🎯 NGUYÊN TẮC CHÍNH

### 1. HIỆU SUẤT LÀ ƯU TIÊN HÀNG ĐẦU
- **Mục tiêu**: Tải trang < 1 giây, tương tác < 100ms
- **Nguyên tắc**: "Performance over Pretty"
- **Đo lường**: Tổng dung lượng assets < 100KB

### 2. THIẾT KẾ BASIC & CLASSIC
- **Phong cách**: Đơn giản, truyền thống, không trend
- **Màu sắc**: Trung tính, không chói mắt
- **Layout**: Quen thuộc, dễ sử dụng

---

## 📝 QUY TẮC HTML

### ✅ ĐƯỢC PHÉP
- **Semantic HTML5**: `<header>`, `<main>`, `<section>`, `<footer>`
- **Form elements chuẩn**: `<input>`, `<select>`, `<button>`, `<label>`
- **Structure đơn giản**: Tối đa 3-4 cấp nested
- **Accessibility**: `aria-*`, `role`, proper labels

### ❌ KHÔNG ĐƯỢC PHÉP
- **Custom components phức tạp**: slider, carousel, modal fancy
- **Nested quá sâu**: > 5 cấp DOM
- **Inline styles**: Tất cả CSS phải external


### 📋 TEMPLATE STRUCTURE
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Page Title]</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>[Main Title]</h1>
        </header>
        <main class="main">
            <!-- Content sections -->
        </main>
        <footer class="footer">
            <!-- Action buttons -->
        </footer>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

---

## 🎨 QUY TẮC CSS

### ✅ ĐƯỢC PHÉP
- **CSS Reset tối giản**: `margin: 0; padding: 0; box-sizing: border-box;`
- **Fonts hệ thống**: Arial, sans-serif, system fonts
- **Colors basic**: Grayscale, blue accent (#007cba)
- **Layout đơn giản**: Flexbox, Grid cơ bản

### ❌ KHÔNG ĐƯỢC PHÉP
- **Animations/Transitions**: Trừ hover states đơn giản
- **Custom fonts**: Google Fonts, web fonts

- **Complex selectors**: > 3 levels, pseudo-selectors phức tạp


### 📋 COLOR PALETTE CHUẨN
```css
/* Light Theme */
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--bg-tertiary: #f0f0f0;
--text-primary: #333333;
--text-secondary: #666666;
--border-color: #dddddd;
--accent-color: #007cba;

/* Dark Theme */
--bg-primary-dark: #3c3c3c;
--bg-secondary-dark: #2c2c2c;
--bg-tertiary-dark: #444444;
--text-primary-dark: #e0e0e0;
--text-secondary-dark: #cccccc;
--border-color-dark: #555555;
```

### 📋 RESPONSIVE BREAKPOINTS
```css
/* Mobile First */
@media (max-width: 600px) { /* Mobile */ }
@media (min-width: 601px) and (max-width: 1024px) { /* Tablet */ }
@media (min-width: 1025px) { /* Desktop */ }
```

### 📋 TYPOGRAPHY SCALE
```css
h1 { font-size: 20px; font-weight: bold; }
h2 { font-size: 16px; font-weight: bold; }
h3 { font-size: 14px; font-weight: bold; }
body { font-size: 14px; line-height: 1.4; }
small { font-size: 12px; }
```

---

## ⚙️ QUY TẮC JAVASCRIPT

### ✅ ĐƯỢC PHÉP
- **Vanilla JavaScript**: ES6+ syntax
- **DOM manipulation**: querySelector, addEventListener
- **Local storage**: Lưu trữ settings đơn giản
- **Simple validation**: Required fields, number ranges
- **Debouncing**: Cho auto-save, search

### ❌ KHÔNG ĐƯỢC PHÉP


### 📋 CODE STRUCTURE
```javascript
(function() {
    'use strict';
    
    // Constants
    const CONFIG = {
        AUTO_SAVE_DELAY: 1000,
        MAX_RETRIES: 3
    };
    
    // State
    let currentConfig = {};
    
    // Core functions
    function init() { /* Initialize */ }
    function loadConfig() { /* Load from storage */ }
    function saveConfig() { /* Save to storage */ }
    function validateInput() { /* Validate */ }
    
    // Event handlers
    function handleFormChange() { /* Handle changes */ }
    
    // Initialize when DOM ready
    document.addEventListener('DOMContentLoaded', init);
})();
```

### 📋 PERFORMANCE RULES
- **Debounce user input**: 300-1000ms delay
- **Cache DOM queries**: Lưu references
- **Event delegation**: Thay vì multiple listeners
- **Lazy loading**: Chỉ load khi cần
- **Error handling**: Try-catch cho storage operations

---

## 📱 QUY TẮC UX/UI

### ✅ LAYOUT PRINCIPLES
- **Container max-width**: 800px - 1200px
- **Padding/Margin**: 15px, 20px, 25px (consistent)
- **Form spacing**: 12px giữa các form groups
- **Button spacing**: 8px margin giữa buttons
- **Section spacing**: 25px giữa các sections

### ✅ FORM DESIGN
- **Label trên input**: Luôn có label rõ ràng
- **Input height**: 32px minimum (mobile friendly)
- **Button height**: 32px - 40px
- **Input width**: 100% trong container
- **Error states**: Red border + error message

### ✅ COLOR USAGE
- **Background**: White/Light gray chủ đạo
- **Text**: Dark gray (#333) cho readability
- **Borders**: Light gray (#ddd, #ccc)
- **Accent**: Blue (#007cba) cho primary actions
- **Error**: Red (#dc3545)
- **Success**: Green (#28a745)

### ❌ KHÔNG ĐƯỢC PHÉP
- **Bright colors**: Neon, rainbow, gradients
- **Custom icons**: Giữ text-based hoặc Unicode symbols
- **Fancy effects**: Drop shadows, glows, transforms
- **Complex layouts**: Multi-column, masonry, advanced grid

---

## 📊 QUY TẮC HIỆU SUẤT

### ✅ FILE SIZE LIMITS


### ✅ LOADING PERFORMANCE
- **Critical CSS**: Inline hoặc preload
- **JavaScript**: Async/defer khi có thể
- **Images**: Lazy loading, optimize format
- **Fonts**: System fonts only
- **HTTP requests**: < 10 requests total

### ✅ RUNTIME PERFORMANCE
- **DOM queries**: Cache và reuse
- **Event listeners**: Passive khi có thể
- **Memory leaks**: Remove listeners khi cleanup
- **Reflows/Repaints**: Minimize layout changes
- **Local storage**: < 5MB data

---

## 🧪 QUY TẮC TESTING

### ✅ BROWSER SUPPORT
- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Fallbacks**: Graceful degradation cho older browsers

### ✅ PERFORMANCE METRICS
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1

### ✅ ACCESSIBILITY
- **Keyboard navigation**: Tab order logical
- **Screen readers**: Proper ARIA labels
- **Color contrast**: 4.5:1 minimum ratio
- **Focus indicators**: Visible focus states

---

## 📋 CHECKLIST TRƯỚC KHI DEPLOY

### ✅ CODE QUALITY
- [ ] Không có console.log trong production
- [ ] Tất cả CSS được minify
- [ ] JavaScript được minify
- [ ] HTML validated
- [ ] No linting errors

### ✅ PERFORMANCE
- [ ] Page load < 2s trên 3G
- [ ] Total size < 200KB
- [ ] No JavaScript errors
- [ ] No CSS unused rules
- [ ] Images optimized

### ✅ FUNCTIONALITY
- [ ] All forms validate properly
- [ ] Local storage works
- [ ] Responsive trên mobile
- [ ] Cross-browser tested
- [ ] Keyboard accessible

### ✅ UX
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Success feedback shown
- [ ] Navigation intuitive
- [ ] Content readable

---

## 🎯 KẾT LUẬN

**Mục tiêu cuối cùng**: Tạo ra giao diện web đơn giản, nhanh, ổn định và dễ sử dụng cho mọi người trên mọi thiết bị.

**Slogan**: "Simple, Fast, Reliable" - Đơn giản, Nhanh, Tin cậy

**Kiểm tra cuối**: Nếu một người dùng 60+ tuổi có thể sử dụng dễ dàng trên điện thoại cũ với mạng chậm, thì bạn đã thành công!

---

*Quy tắc này được tạo để đảm bảo tính nhất quán và chất lượng cho tất cả các dự án web interface.*
