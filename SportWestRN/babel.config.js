module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'module:react-native-dotenv',
    ['import', {libraryName: '@ant-design/react-native'}],
    'react-native-reanimated/plugin',
  ],
};
