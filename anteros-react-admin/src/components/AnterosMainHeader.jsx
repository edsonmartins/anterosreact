import React, { Component } from "react";
import PropTypes from 'prop-types';
import {
  AnterosButton,
  AnterosAdvancedDropdown,
  AnterosAdvancedDropdownMenu,
  AnterosAdvancedDropdownToggle
} from "anteros-react-buttons";
import { AnterosText } from "anteros-react-label";
import AnterosMediaQuery from "./AnterosMediaQuery";
import { AnterosToolbar, AnterosToolbarGroup } from "anteros-react-containers";
import { Link } from "react-router-dom";
import { AnterosInputSearch } from "anteros-react-querybuilder";
import { AnterosImage } from "anteros-react-image";
import AnterosUserMenu from "./AnterosUserMenu";
import { autoBind } from "anteros-react-core";

function isBase64(str) {
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
}

export default class AnterosMainHeader extends Component {
  constructor(props) {
    super(props);
    this.toggleScreenFull = this.toggleScreenFull.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.toggleUserDropdownMenu = this.toggleUserDropdownMenu.bind(this);
    this.state = {
      customizer: false,
      userDropdownMenu: false
    };
    autoBind(this);
  }

  toggleSidebar(event) {
    const open = !this.props.sidebarOpen;
    this.props.onSetOpenSidebar(open);
  }

  toggleScreenFull() {
    var body = document.body;
    if ((body.className + " ").indexOf("full-screen") === -1) {
      var b = document.getElementsByTagName("body")[0];
      b.className += "full-screen";
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      var bd = document.getElementsByTagName("body")[0];
      bd.className = bd.className.replace(/\bfull-screen\b/, "");
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  toggleUserDropdownMenu() {
    this.setState({
      ...this.state,
      userDropdownMenu: !this.state.userDropdownMenu
    });
  }

  static get componentName() {
    return "AnterosMainHeader";
  }

  render() {
    let userActions;
    let toolbarEnd;
    let toolbarCenter;
    if (this.props.children) {
      let arrChildren = React.Children.toArray(this.props.children);
      arrChildren.forEach(function (child) {
        if (child.type && (child.type.componentName === 'UserActions')) {
          userActions = child.props.children;
        } else if (child.type && (child.type.componentName === 'ToolbarEnd')) {
          toolbarEnd = child.props.children;
        } else if (child.type && (child.type.componentName === 'ToolbarCenter')) {
          toolbarCenter = child.props.children;
        }
      });
    }

    const { horizontalMenu, logoNormal, sidebarOpen } = this.props;
    let imgUser = this.props.avatar;
    let isB64 = isBase64(imgUser);
    return (
      <AnterosToolbar>
        <AnterosToolbarGroup justifyContent="start">
          {horizontalMenu || sidebarOpen ? (
            <div className="site-logo">
              <Link to="/" className="logo-normal">
                <img src={logoNormal} alt="site-logo" />
              </Link>
            </div>
          ) : null}
          {horizontalMenu ? null : (
            <AnterosButton
              circle
              medium
              icon="fal fa-bars"
              iconSize="24px"
              color={this.props.toolbarIconColor}
              onButtonClick={this.toggleSidebar}
              hintPosition="bottom"
            />
          )}
          <AnterosButton
            medium
            icon="fab fa-buromobelexperte"
            iconSize="24px"
            color={this.props.toolbarIconColor}
            hintPosition="bottom"
          />

          {this.props.showInputSearch ? <AnterosMediaQuery minDeviceWidth={1224}>
            <AnterosInputSearch placeHolder="Procurar" />
          </AnterosMediaQuery> : null}
        </AnterosToolbarGroup>

        <AnterosToolbarGroup justifyContent="center" colSize="col-sm-2">
          {toolbarCenter}
        </AnterosToolbarGroup>

        <AnterosToolbarGroup justifyContent="end">
          {toolbarEnd}

          <AnterosAdvancedDropdown
            className="user-profile user-menu"
            isOpen={this.state.userDropdownMenu}
            toggle={this.toggleUserDropdownMenu}
          >
            <AnterosAdvancedDropdownToggle caret>
              <AnterosImage
                src={
                  imgUser && isB64
                    ? 'data:image;base64,' + imgUser
                    : imgUser
                }
                circle
                width="42px"
                height="42px"
              />
              <AnterosText text={this.props.userName} fontSize="12px"/>
            </AnterosAdvancedDropdownToggle>
            <AnterosAdvancedDropdownMenu right>
              <AnterosUserMenu
                userName={this.props.userName}
                email={this.props.email}
              >
                {userActions}
              </AnterosUserMenu>
            </AnterosAdvancedDropdownMenu>
          </AnterosAdvancedDropdown>
        </AnterosToolbarGroup>
      </AnterosToolbar>
    );
  }
}

AnterosMainHeader.propTypes = {
  showInputSearch: PropTypes.bool.isRequired,
  toolbarIconColor: PropTypes.any
}

AnterosMainHeader.defaultPropTypes = {
  showInputSearch: true,
  toolbarIconColor: 'white'
}

export class UserActions extends Component {
  constructor(props) {
    super(props);
    autobind(this);
  }

  static get componentName() {
    return "UserActions";
  }

  render() {
    return null;
  }
}

export class ToolbarEnd extends Component {
  constructor(props) {
    super(props);
    autobind(this);
  }

  static get componentName() {
    return "ToolbarEnd";
  }

  render() {
    return null;
  }
}

export class ToolbarCenter extends Component {
  constructor(props) {
    super(props);
    autobind(this);
  }

  static get componentName() {
    return "ToolbarCenter";
  }

  render() {
    return null;
  }
}
