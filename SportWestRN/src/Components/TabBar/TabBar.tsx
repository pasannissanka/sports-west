import TabBar from '@ant-design/react-native/lib/tab-bar';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React from 'react';
import {Text, View} from 'react-native';

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const isFocused = (index: number) => {
    return state.index === index;
  };

  const onTabPressed = (key: string, name: string, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: key,
      canPreventDefault: true,
    });

    if (!isFocused(index) && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  return (
    <TabBar
      unselectedTintColor="#949494"
      tintColor="#33A3F4"
      barTintColor="#f5f5f5">
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        return (
          <TabBar.Item
            key={index}
            selected={isFocused(index)}
            onPress={() => onTabPressed(route.key, route.name, index)}
            title={options.title || route.name}>
            <Text>{label}</Text>
          </TabBar.Item>
        );
      })}
    </TabBar>
  );
};
