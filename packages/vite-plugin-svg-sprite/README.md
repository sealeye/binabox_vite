# @bro-academy/vite-plugin-svg-sprite

A Vite plugin to generate an SVG sprite from individual SVG icons during the build process. Optimizes SVGs and outputs a single sprite file for efficient use in your project.

## Features

- Combines multiple SVG icons into a single SVG sprite
- Optimizes SVGs using SVGO plugins
- Generates sprite at build time
- Customizable icon ID prefix

## Installation

Install the plugin and its peer dependency:

```sh
npm install @bro-academy/vite-plugin-svg-sprite --save-dev
```

## Usage

Add the plugin to your `vite.config.js`:

```js
import svgSprite from '@bro-academy/vite-plugin-svg-sprite';

export default {
  plugins: [
    svgSprite()
  ]
};
```

## How it works

- During the Vite build, the plugin scans the `src/assets/icons` directory for `.svg` files.
- Each SVG is optimized and added to the sprite.
- The generated sprite is saved as `src/assets/sprite.svg`.

## Example

Place your SVG icons in `src/assets/icons/`:

```
src/assets/icons/
  ├── home.svg
  └── user.svg
```

After build, use the sprite in your HTML:

```html
<svg><use xlink:href="/src/assets/sprite.svg#icon-home"></use></svg>
<svg><use xlink:href="/src/assets/sprite.svg#icon-user"></use></svg>
```

## Options

Currently, the plugin does not expose user-configurable options.

## License

ISC

---