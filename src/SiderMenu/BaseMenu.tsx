import IconFont from '../IconFont';
import { isUrl } from '../utils/utils';
import { Icon, Menu } from 'antd';
import { MenuMode, MenuTheme } from 'antd/lib/menu';
import classNames from 'classnames';
import React, { Component } from 'react';
import { RouterTypes } from 'umi';
import Link from 'umi/link';
import { urlToList } from '../utils/pathTools';
import './index.less';
import { getMenuMatches } from './SiderMenuUtils';
import { MenuDataItem, Route } from '../typings';
import { Settings } from '../defaultSettings';

const { SubMenu } = Menu;

// Allow menu.js config icon as string or ReactNode
//   icon: 'setting',
//   icon: 'icon-geren' #For Iconfont ,
//   icon: 'http://demo.com/icon.png',
//   icon: <Icon type="setting" />,
const getIcon = (icon?: string | React.ReactNode) => {
  if (typeof icon === 'string') {
    if (isUrl(icon)) {
      return (
        <Icon
          component={() => (
            <img src={icon} alt="icon" className="ant-prefix}-pro-sider-menu-icon" />
          )}
        />
      );
    }
    if (icon.startsWith('icon-')) {
      return <IconFont type={icon} />;
    }
    return <Icon type={icon} />;
  }
  return icon;
};

export interface BaseMenuProps extends Partial<RouterTypes<Route>> {
  className?: string;
  collapsed?: boolean;
  flatMenuKeys?: any[];
  handleOpenChange?: (openKeys: string[]) => void;
  isMobile?: boolean;
  menuData?: MenuDataItem[];
  mode?: MenuMode;
  onCollapse?: (collapsed: boolean) => void;
  onOpenChange?: (openKeys: string[]) => void;
  openKeys?: string[];
  style?: React.CSSProperties;
  theme?: MenuTheme;
  settings: Settings;
  renderMenuItem?: (item: MenuDataItem, defaultDom: React.ReactNode) => React.ReactNode;
}

export default class BaseMenu extends Component<BaseMenuProps> {
  static defaultProps: Partial<BaseMenuProps> = {
    flatMenuKeys: [],
    onCollapse: () => void 0,
    isMobile: false,
    openKeys: [],
    collapsed: false,
    handleOpenChange: () => void 0,
    menuData: [],
    onOpenChange: () => void 0,
  };

  /**
   * 获得菜单子节点
   */
  getNavMenuItems = (menusData: MenuDataItem[] = []): React.ReactNode[] => {
    return menusData
      .filter(item => item.name && !item.hideInMenu)
      .map(item => this.getSubMenuOrItem(item))
      .filter(item => item);
  };

  // Get the currently selected menu
  getSelectedMenuKeys = (pathname: string): string[] => {
    const { flatMenuKeys } = this.props;
    return urlToList(pathname)
      .map(itemPath => getMenuMatches(flatMenuKeys, itemPath).pop())
      .filter(item => item) as string[];
  };

  /**
   * get SubMenu or Item
   */
  getSubMenuOrItem = (item: MenuDataItem): React.ReactNode => {
    if (
      Array.isArray(item.children) &&
      !item.hideChildrenInMenu &&
      item.children.some(child => (child.name ? true : false))
    ) {
      return (
        <SubMenu
          title={
            item.icon ? (
              <span>
                {getIcon(item.icon)}
                <span>{item.name}</span>
              </span>
            ) : (
              item.name
            )
          }
          key={item.path}
        >
          {this.getNavMenuItems(item.children)}
        </SubMenu>
      );
    }
    return <Menu.Item key={item.path}>{this.getMenuItemPath(item)}</Menu.Item>;
  };

  /**
   * 判断是否是http链接.返回 Link 或 a
   * Judge whether it is http link.return a or Link
   * @memberof SiderMenu
   */
  getMenuItemPath = (item: MenuDataItem) => {
    const { name } = item;
    const itemPath = this.conversionPath(item.path);
    const icon = getIcon(item.icon);
    const { location, isMobile, onCollapse, renderMenuItem } = this.props;
    const { target } = item;
    let defaultItem = (
      <Link
        to={itemPath}
        target={target}
        replace={itemPath === location!.pathname}
        onClick={isMobile ? () => onCollapse!(true) : void 0}
      >
        {icon}
        <span>{name}</span>
      </Link>
    );

    // Is it a http link
    if (/^https?:\/\//.test(itemPath)) {
      defaultItem = (
        <a href={itemPath} target={target}>
          {icon}
          <span>{name}</span>
        </a>
      );
    }
    if (renderMenuItem) {
      return renderMenuItem(item, defaultItem);
    }
    return defaultItem;
  };

  conversionPath = (path: string) => {
    if (path && path.indexOf('http') === 0) {
      return path;
    }
    return `/${path || ''}`.replace(/\/+/g, '/');
  };

  warp: HTMLDivElement | undefined;

  getPopupContainer = (fixedHeader: boolean, layout: string): HTMLElement => {
    if (fixedHeader && layout === 'topmenu' && this.warp) {
      return this.warp;
    }
    return document.body;
  };
  getRef = (ref: HTMLDivElement) => {
    this.warp = ref;
  };
  render() {
    const {
      openKeys,
      theme,
      mode,
      location,
      className,
      collapsed,
      handleOpenChange,
      style,
      settings: { fixedHeader, layout },
      menuData,
    } = this.props;
    // if pathname can't match, use the nearest parent's key
    let selectedKeys = this.getSelectedMenuKeys(location!.pathname);
    if (!selectedKeys.length && openKeys) {
      selectedKeys = [openKeys[openKeys.length - 1]];
    }
    let props = {};
    if (openKeys && !collapsed) {
      props = {
        openKeys: openKeys.length === 0 ? [...selectedKeys] : openKeys,
      };
    }
    const cls = classNames(className, {
      'top-nav-menu': mode === 'horizontal',
    });

    return (
      <>
        <Menu
          key="Menu"
          mode={mode}
          theme={theme}
          onOpenChange={handleOpenChange}
          selectedKeys={selectedKeys}
          style={style}
          className={cls}
          getPopupContainer={() => this.getPopupContainer(fixedHeader, layout)}
          {...props}
        >
          {this.getNavMenuItems(menuData)}
        </Menu>
        <div ref={this.getRef} />
      </>
    );
  }
}
