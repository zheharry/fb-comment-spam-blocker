const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    popup: './src/popup/popup.js'
  },
  output: {
    path: path.resolve(__dirname, '../dist/safari'),
    filename: '[name]/[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: 'manifest.json',
          transform(content) {
            // Transform manifest for Safari (Manifest V2)
            const manifest = JSON.parse(content.toString())
            
            // Convert to Manifest V2 for Safari compatibility
            const safariManifest = {
              manifest_version: 2,
              name: manifest.name,
              version: manifest.version,
              description: manifest.description,
              
              permissions: [
                'storage',
                'activeTab',
                '*://*.facebook.com/*',
                '*://*.fb.com/*'
              ],
              
              background: {
                scripts: ['background/background.js'],
                persistent: false
              },
              
              content_scripts: manifest.content_scripts,
              
              browser_action: {
                default_popup: manifest.action.default_popup,
                default_title: manifest.action.default_title,
                default_icon: manifest.action.default_icon
              },
              
              icons: manifest.icons,
              web_accessible_resources: manifest.web_accessible_resources.map(resource => resource.resources).flat()
            }
            
            return JSON.stringify(safariManifest, null, 2)
          }
        },
        {
          from: 'src/popup/popup.html',
          to: 'popup/popup.html'
        },
        {
          from: 'src/popup/popup.css',
          to: 'popup/popup.css'
        },
        {
          from: 'src/content/content.css',
          to: 'content/content.css'
        },
        {
          from: 'src/icons',
          to: 'icons',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.json']
  },
  optimization: {
    minimize: false // Keep readable for debugging
  }
}