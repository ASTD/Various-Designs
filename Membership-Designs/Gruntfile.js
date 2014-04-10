module.exports = function (grunt) {
  var javascripts = [],
      stylesheets = 'app/stylesheets/styles.scss',
      images = [
        'app/images/graphics/**/*{.png, .jpg, .gif}',
        'app/images/photography/**/*{.png, .jpg, .gif}'
      ],
      icons = 'app/svg/*.svg';

  javascripts = [
    'app/javascripts/vendor/**/*.js',
    'app/javascripts/**/*.js',
    '!app/javascripts/libs/**/*.js'
  ];
  grunt.initConfig({

    // Javascript Tasks
    // ---------------------------------------------

    concat: {
      dev: {
        src: [
          javascripts,
          '!app/javascripts/fallback/**/*.js'
        ],
        dest: 'public/javascripts/scripts.js',
        separator: ';'
      }
    },

    jshint: {
      dev: [javascripts, '!app/javascripts/vendor/**/*.js']
    },

    uglify: {
      dist: {
        src: [
          javascripts,
          '!app/javascripts/fallback/**/*.js'
        ],
        dest: 'public/javascripts/scripts.min.js',
        separator: ';'
      }
    },


    // CSS Tasks
    // ---------------------------------------------

    sass: {
      dev: {
        options: {
          lineNumbers: true,
          style: 'expanded'
        },
        files: {
          'public/stylesheets/styles.css': stylesheets
        }
      },
      dist: {
        options: {
          style: 'compressed',
          quiet: true
        },
        files: {
          'public/stylesheets/styles.min.css': stylesheets
        }
      }
    },


    // Image Tasks
    // ---------------------------------------------

    smushit: {
      graphics: {
        src: 'app/images/graphics/',
        dest: 'public/images/graphics'
      },
      photography: {
        src: 'app/images/photography/',
        dest: 'public/images/photography'
      }
    },

    sprite: {
      all: {
        algorithm: 'left-right',
        src: 'app/images/sprites-dev/*.png',
        destImg: 'app/images/graphics/sprite.png',
        destCSS: 'app/stylesheets/generated/sprite.scss',
        imgPath: '../images/graphics/sprite.png'
      }
    },


    // Font Tasks
    // ---------------------------------------------

    webfont: {
      icons: {
        src: icons,
        dest: 'app/fonts',
        destCss: 'app/stylesheets/generated/',
        options: {
          htmlDemo: false,
          relativeFontPath: '../fonts/',
          stylesheet: 'scss',
          syntax: 'bootstrap'
        }
      }
    },


    // Misc Tasks
    // ---------------------------------------------

    copy: {
      jekyll: {
        files: [
          {
            'expand': true,
            'cwd': 'app/jekyll/_site',
            'src': ['**/*.html'],
            'dest': 'public/'
          }
        ]
      },
      javascripts: {
        files: [
          {
            expand: true,
            cwd: 'app/javascripts/libs',
            src: ['**/*.js'],
            dest: 'public/javascripts/libs'
          }
        ]
      },
      fonts: {
        files: [
          {
            expand: true,
            cwd: 'app/fonts',
            src: ['**/*'],
            dest: 'public/fonts/'
          }
        ]
      },
      images: {
        files: [
          {
            expand: true,
            cwd: 'app/images',
            src: ['**/*'],
            dest: 'public/images/'
          }
        ]
      },
      styles: {
        files: [
          {
            expand: true,
            cwd: 'app/stylesheets',
            src: ['legacy.css'],
            dest: 'public/stylesheets'
          }
        ]
      }
    },


    jekyll: {
      dev: {
        src: 'app/jekyll',
        dest: 'app/jekyll/_site'
      }
    },

    watch: {
      scripts: {
        files: javascripts,
        tasks: [
          'concat',
          'jshint',
          'uglify'
        ],
        spawn: true
      },
      libs: {
        files: 'app/javascripts/libs/**/*.js',
        tasks: 'copy:javascripts'
      },
      sass: {
        files: 'app/stylesheets/**/*{.scss, .sass}',
        tasks: ['sass'],
        spawn: true
      },
      webfont: {
        files: icons,
        tasks: ['webfont', 'copy:fonts']
      },
      images: {
        files: images,
        tasks: [
          'smushit'
        ]
      },
      sprites: {
        files: 'app/images/sprites-dev/*.png',
        tasks: ['sprite']
      },
      legacyStyles: {
        files: 'app/stylesheets/legacy.css',
        tasks: ['copy:styles']
      },
      jekyll: {
        files: [
          'app/jekyll/**/*.html',
          '!app/jekyll/_site/**/*.html'
        ],
        tasks: ['jekyll', 'copy:jekyll']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-jekyll');
  grunt.loadNpmTasks('grunt-smushit');
  grunt.loadNpmTasks('grunt-spritesmith');
  grunt.loadNpmTasks('grunt-webfont');

  grunt.registerTask('default', [
    'watch'
  ]);

  grunt.registerTask('dev', [
    'jshint',
    'concat',
    'sass:dev',
    'jekyll',
    'copy:jekyll'
  ]);

  grunt.registerTask('dist', [
    'uglify',
    'sass:dist'
  ]);
};
