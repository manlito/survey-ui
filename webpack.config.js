const path = require('path')
const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally')
const CopyPlugin = require("copy-webpack-plugin")
const CleanCSS = require('clean-css')
const uglifyJS = require('uglify-js')
const { readdirSync } = require('fs')

const productionMode = process.env.NODE_ENV == "production"

/**
 * Wraps minification function for concatenated JS assets
 * @param {string} asset name of the asset
 * @returns function to transform asset if prod, or the asset name
 */
const bundleJS = (asset) => {
  if (productionMode) {
    return (code) => {
      const min = uglifyJS.minify(code, {
        sourceMap: {
          filename: `${asset}.js`,
          url: `${asset}.js.map`
        }
      })
      return {
        [`vendor.js`]: min.code,
        [`vendor.js.map`]: min.map
      }
    }
  } else {
    return `${asset}.js`
  }
}

/**
 * Wraps minification functions for CSS assets
 * @param {string} asset name of the CSS asset
 * @returns function to transform asset if prod, or the asset name
 */
const bundleCSS = (asset) => {
  if (productionMode) {
    return (code) => ({
      [`${asset}.css`]: new CleanCSS({}).minify(code).styles
    })
  } else {
    return `${asset}.css`
  }
}

/**
 * Computes allowed combinations of themes and assets for respondant
 * @returns CSS outputs for themes and styles
 */
const buildRespondantCSS = () => {
  const getDirectories = source =>
    readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  const templates = getDirectories('src/stylesheets/respondant/templates')
  const themes = getDirectories('src/stylesheets/respondant/themes')
  let respondantCSS = []
  templates.map(template => (themes.map(theme => {
    respondantCSS.push({
      src: [
        'src/stylesheets/respondant/respondant.css',
        `src/stylesheets/respondant/templates/${template}/default.css`,
        `src/stylesheets/respondant/themes/${theme}/default.css`
      ],
      dest: bundleCSS(`respondant-${template.toLocaleLowerCase()}-${theme.toLocaleLowerCase()}`)
    })
  })))
  return respondantCSS
}

module.exports = {
  entry: {
    'respondant': './src/scripts/respondant/respondant.js',
    'editor': './src/scripts/editor/editor.js',
  },
  mode: productionMode ? "production" : "development",
  optimization: {
    minimize: productionMode
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      name: ['OverResponse', '[name]'],
      type: 'umd',
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/scripts", to: "scripts" },
        { from: "src/stylesheets", to: "stylesheets" },
      ],
    }),
    new MergeIntoSingleFilePlugin({
      files: [
        {
          src: [
            'src/scripts/3rd-party/jquery/jquery.cookie.js',
            'src/scripts/3rd-party/jquery/jquery.mousewheel.js',
            'src/scripts/3rd-party/jquery/ui/jquery-ui.js',
            'src/scripts/3rd-party/jquery/ui/time-picker/jquery.ui.timepicker.js',
            'src/scripts/3rd-party/noty/jquery.noty.js',
            'src/scripts/3rd-party/noty/layouts/bottom.js',
            'src/scripts/3rd-party/noty/themes/default.js',
            'src/scripts/3rd-party/bootstrap/bootstrap.js',
            'src/scripts/3rd-party/nicedit/nicEdit.js',
            'src/scripts/Common.js'
          ],
          dest: bundleJS('vendor')
        }, {
          src: [
            'src/scripts/3rd-party/jquery/ui/jquery-ui.css',
            'src/scripts/3rd-party/jquery/ui/jquery-ui.theme.css',
            'src/scripts/3rd-party/jquery/ui/jquery-ui.structure.css',
            'src/scripts/3rd-party/jquery/ui/time-picker/jquery.ui.timepicker.css',
            'src/stylesheets/3rd-party/bootstrap/less/bootstrap.css',
            'src/stylesheets/ui/base/BaseUIStyleSheet.css',
            'src/stylesheets/ui/user/UserUIStyleSheet.css',
            'src/stylesheets/editor/SurveyEditorStyleSheet.css',
            'src/stylesheets/respondant/icons.css',
          ],
          dest: bundleCSS('vendor')
        },
        ...buildRespondantCSS()
      ]
    }),
  ]

}
