# Velir ASTD - Membership
## Front-End Code for the new membership section (desktop only) 
======

## General

- For development files, please see `app/`.
- For production files, please see `public/`. Do not add or edit any files in the "public" folder. They will automatically get overwritten when running grunt. Make all changes in the "app" folder.

## CSS / Scss

#### `styles.css` includes
- [Bourbon](http://bourbon.io/)
- [Neat](http://neat.bourbon.io) 

## JS

Using jQuery v1.10.2 with jQuery Migrate v1.1.0.

#### Plugins Used
- [Flexslider](http://woothemes.com/flexslider)

#### JavaScript Practices
Vendors and Modules are concatenated into `public/javascripts/scripts.js`


## Build

Uses [Gruntjs](http://gruntjs.com/). Default task runs `watch`.

### Tasks

- Concat
- Copy
- Jekyll
- JSHint
- Sass
- Smushit
- Spritesmith
- Watch
- Webfont