const path = require('path')
const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally')
const CopyPlugin = require("copy-webpack-plugin");
const { readdirSync } = require('fs')

const buildRespondantCSS = () => {
  const getDirectories = source =>
    readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  const templates = getDirectories('src/stylesheets/respondant/templates')
  const themes = getDirectories('src/stylesheets/respondant/themes')
  let respondantCSS = {}
  templates.map(template => (themes.map(theme => {
    respondantCSS[`stylesheets/respondant-${template.toLocaleLowerCase()}-${theme.toLocaleLowerCase()}.css`] = [
      'src/stylesheets/respondant/respondant.css',
      `src/stylesheets/respondant/templates/${template}/default.css`,
      `src/stylesheets/respondant/themes/${theme}/default.css`]
  })))
  return respondantCSS;
}

module.exports = {
  entry: {
    'respondant': './src/scripts/respondant/respondant.js',
    'editor': './src/scripts/editor/editor.js',
  },
  mode: "development",
  optimization: {
    minimize: false
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    library: {
      name: 'overresponse',
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
      files: {
        // "vendor.js": [
        //   'src/scripts/3rd-party/jquery/jquery-1.12.4.js',
        //   'src/scripts/3rd-party/jquery/jquery.cookie.js',
        //   'src/scripts/3rd-party/jquery/jquery.mousewheel.js',
        //   'src/scripts/3rd-party/noty/jquery.noty.js',
        //   'src/scripts/3rd-party/noty/layouts/bottom.js',
        //   'src/scripts/3rd-party/noty/themes/default.js',
        //   'src/scripts/3rd-party/bootstrap/bootstrap.js',
        //   'src/scripts/3rd-party/nicedit/nicEdit.js',
        //   'src/scripts/ui/base/languages/en-us.js',
        //   'src/scripts/ui/base/BaseUI.js',
        //   'src/scripts/ui/user/languages/en-us.js',
        //   'src/scripts/ui/user/UserUI.js',
        //   'src/scripts/respondant/respondant.js',
        //   'src/scripts/respondant/util.js',
        //   'src/scripts/editor/languages/en-us.js',
        //   'src/scripts/editor/SurveyEditor.js',
        // ],
        "vendor.css": [
          'src/stylesheets/3rd-party/jquery/ui/jquery-ui.css',
          'src/stylesheets/3rd-party/jquery/ui/jquery-ui.theme.css',
          'src/stylesheets/3rd-party/jquery/ui/jquery-ui.structure.css',
          'src/stylesheets/3rd-party/jquery/ui/time-picker/jquery.ui.timepicker.css',
          'src/stylesheets/3rd-party/bootstrap/less/bootstrap.css',
          'src/stylesheets/ui/base/BaseUIStyleSheet.css',
          'src/stylesheets/ui/user/UserUIStyleSheet.css',
          'src/stylesheets/editor/SurveyEditorStyleSheet.css',
          'src/stylesheets/respondant/icons.css',
        ],
        ...buildRespondantCSS()
      }
    }),
  ]

}
