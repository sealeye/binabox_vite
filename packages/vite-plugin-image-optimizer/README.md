# @bro-academy/vite-plugin-image-optimizer

A Vite plugin to optimize images in HTML and CSS during the build process. Supports automatic image dimension injection and conversion to modern formats.

## Features

- Optimizes PNG and JPEG images in your build output
- Converts images to WebP and AVIF formats (if requested)
- Injects image dimensions into HTML
- Updates HTML and CSS to reference optimized/converted images

## Installation

Install the plugin and its peer dependency:

```sh
npm install @bro-academy/vite-plugin-image-optimizer --save-dev
```

## Usage

Add the plugin to your `vite.config.js`:

```js
import imageOptimizer from '@bro-academy/vite-plugin-image-optimizer';

export default {
  plugins: [
    imageOptimizer({
      dimensions: true // Set to false to skip adding width/height
    })
  ]
};
```

## How it works

- During build, the plugin scans your HTML and CSS for image references.
- It optimizes and converts only the images actually used in the output.
- HTML and CSS are updated to reference the optimized/converted images.
- Image dimensions are injected into `<img>` tags if enabled.

## Options

| Option      | Type    | Default | Description                                 |
|-------------|---------|---------|---------------------------------------------|
| dimensions  | boolean | true    | Injects width/height attributes into `<img>`|

## Example

### HTML
```html
<img src="/src/assets/images/banner.png?format=avif">
<img src="/src/assets/images/banner.png?format=webp">

<picture>
    <source srcset="/src/assets/images/banner.png?format=webp" type="image/webp">
    <source srcset="/src/assets/images/banner.png?format=avif" type="image/avif">
    <img src="/src/assets/images/main-banner.png">
</picture>
```

### CSS
```css
.class {
    background-image: url('/src/assets/images/banner.png?format=webp');
}
```

## License

ISC

---