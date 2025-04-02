# Gtoast

![Version](https://img.shields.io/github/v/tag/garius-dev/gtoast?label=version&style=flat&color=blue) ![License](https://img.shields.io/badge/license-MIT-green.svg)

A lightweight, customizable, and dependency-free toast notification library by **Garius Dev**. Gtoast provides a simple yet powerful way to display notifications with beautiful animations, customizable themes, and flexible positioning.

## Features
- **Lightweight**: No external dependencies, pure JavaScript and CSS.
- **Customizable**: Themes, icons, animations, and more.
- **Flexible Positioning**: Six predefined positions or fully customizable.
- **Progress Bar**: Sleek "liquid-in-container" design for visual feedback.
- **Accessibility**: Built with usability in mind, extendable for ARIA support.


## Live Demo
🎮 <a href="https://garius-dev.github.io/gtoast/Playground.html" target="_blank" rel="noopener noreferrer">
  **Live Demo Available Here**
</a>

## Installation

### Via CDN (jsDelivr)
Use Gtoast directly from jsDelivr without downloading files:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/garius-dev/gtoast@latest/dist/gtoast.min.css">
<script src="https://cdn.jsdelivr.net/gh/garius-dev/gtoast@latest/dist/gtoast.min.js"></script>
```

### Manual Installation
Download `gtoast.js` and `gtoast.css` from the releases page and include them in your project:
```html
<link rel="stylesheet" href="path/to/gtoast.css">
<script src="path/to/gtoast.js"></script>
```

## Usage

### Basic Example
Display a simple success toast:
```javascript
const toast = new Gtoast();
toast.success("Operation completed!");
```

### With Title and Options
Add a title and customize options:
```javascript
toast.error("Failed to save", "Error", {
  positionClass: "bottom-right",
  autoClose: 3000
});
```

### Full Customization
Use all available options for a fully tailored toast:
```javascript
const toast = new Gtoast({
  closeButton: true,
  newestOnTop: false,
  progressBar: true,
  positionClass: "bottom-left",
  autoClose: 7000,
  theme: "colored",
  transition: "flip",
  closeOnClick: true,
  resetOnHover: true,
  mobileView: true,
  size: 'md',
  successIcon: '<i class="fa-solid fa-circle-check"></i>', // Using Font Awesome
  errorIcon: '<i class="fa-solid fa-circle-exclamation"></i>', // Using Font Awesome
  infoIcon: '<i class="fa-solid fa-circle-info"></i>', // Using Font Awesome
  warningIcon: '<i class="fa-solid fa-triangle-exclamation"></i>', // Using Font Awesome
  closeButtonIcon: '<i class="fa-solid fa-xmark"></i>' // Using Font Awesome
});

toast.warning("System overload detected!", "Warning");
```

## Methods
```javascript
toast.success(message, [title], [options]) // Success toast
toast.error(message, [title], [options]) // Error toast
toast.info(message, [title], [options]) // Info toast
toast.warning(message, [title], [options]) // Warning toast
```
### Arguments:
- `message` (string): Main content (required).
- `title` (string, optional): Title above the message. Omit or use `null` to hide.
- `options` (object, optional): Configuration overrides.

## Configuration Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| closeButton | Boolean | true | Show a close button. |
| newestOnTop | Boolean | true | Stack new toasts on top. |
| progressBar | Boolean | true | Show a progress bar. |
| positionClass | String | "top-right" | Position: top-left, top-right, top-center, bottom-left, bottom-right, bottom-center. |
| autoClose | Number | 5000 | Auto-close time (ms). Set false to disable. |
| theme | String | "light" | Theme: light, dark, colored. |
| transition | String | "slide" | Animation: slide, bounce, zoom, flip. |
| closeOnClick | Boolean | false | Close toast on click. |
| size | String | "xs" | Toast width: xs, md, lg, xl |
| mobileView | Boolean | false | 	Adjusts toast for mobile devices. |
| resetOnHover | Boolean | false | Reset progress bar on hover. |
| successIcon | String | Custom SVG | Custom success icon (HTML/SVG). |
| errorIcon | String | Custom SVG | Custom error icon (HTML/SVG). |
| infoIcon | String | Custom SVG | Custom info icon (HTML/SVG). |
| warningIcon | String | Custom SVG | Custom warning icon (HTML/SVG). |
| closeButtonIcon | String | Custom SVG | Custom close button icon (HTML/SVG). |

## Styling
Customize Gtoast with CSS variables:
```css
.gtoast[data-theme="light"] {
    --gtoast-close-btn-color: #757575;
    --gtoast-color-success: #00a400;
    --gtoast-color-info: #3498db;
    --gtoast-color-warning: #f1c40f;
    --gtoast-color-error: hsl(6, 78%, 57%);
    --gtoast-bg-success: #fff;
    --gtoast-text-success: #757575;
    --gtoast-bg-info: #fff;
    --gtoast-text-info: #757575;
    --gtoast-bg-warning: #fff;
    --gtoast-text-warning: #757575;
    --gtoast-bg-error: #fff;
    --gtoast-text-error: #757575;
    --gtoast-progress-color-success: #00a400;
    --gtoast-progress-color-info: #3498db;
    --gtoast-progress-color-warning: #f1c40f;
    --gtoast-progress-color-error: hsl(6, 78%, 57%);
}
```

### Styling Elements
- Toast Background Color: `--gtoast-bg-*`
- Title and Icon Color: `--gtoast-color-*`
- Message Color: `--gtoast-text-*`
- Progressbar Color: `--gtoast-progress-color-*`

## Contributing
Fork the repo, make your changes, and submit a pull request. For bugs or feature requests, open an issue.

## License
Gtoast is licensed under the MIT License.

## About Garius Dev
Developed with ❤️ by Garius Dev, a company focused on innovative automation and software solutions. **[Visit us at Garius Tech](https://gariustech.com/)**.
