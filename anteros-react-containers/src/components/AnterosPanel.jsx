import React, { Component } from 'react';
import { AnterosUtils } from "anteros-react-core";
import { buildGridClassNames, columnProps } from "anteros-react-layout";
import PropTypes from 'prop-types';


class AnterosPanel extends Component {
    constructor(props) {
        super(props);

    }
    render() {
        const colClasses = buildGridClassNames(this.props, false, []);

        let className = AnterosUtils.buildClassNames("panel panel-default",
            (this.props.textCenter ? "text-center" : ""),
            (this.props.textRight ? "text-right" : ""),
            (this.props.success ? (this.props.outline ? "panel-outline-success" : "panel-success") : ""),
            (this.props.danger ? (this.props.outline ? "panel-outline-danger" : "panel-danger") : ""),
            (this.props.info ? (this.props.outline ? "panel-outline-info" : "panel-info") : ""),
            (this.props.primary ? (this.props.outline ? "panel-outline-primary" : "panel-primary") : ""),
            (this.props.warning ? (this.props.outline ? "panel-outline-warning" : "panel-warning") : ""),
            (this.props.className ? this.props.className : ""),
            (this.props.cardInverse ? "panel-inverse" : ""), colClasses, this.props.className);

        let style = { height: this.props.height, width: this.props.width, minHeight: this.props.minHeight, minWidth: this.props.minWidth, ...this.props.style };
        if (!this.props.border) {
            style = { ...style, border: 0, boxShadow: "none" };
        }
        return (
            <div id={this.props.id}
                className={className}
                style={style}
                onMouseOver={this.props.onMouseOver}
                onMouseOut={this.props.onMouseOut}
                onClick={this.onPanelClick}>
                {this.props.children}
            </div>
        )
    }
}


AnterosPanel.propTypes = {
    className: PropTypes.string,
    danger: PropTypes.bool,
    success: PropTypes.bool,
    info: PropTypes.bool,
    warning: PropTypes.bool,
    primary: PropTypes.bool,
    secondary: PropTypes.bool,
    id: PropTypes.string,
    outline: PropTypes.bool.isRequired,
    withScroll: PropTypes.bool.isRequired,
    minHeight: PropTypes.string,
    minWidth: PropTypes.string,
    style: PropTypes.object,
    extraSmall: columnProps,
    small: columnProps,
    medium: columnProps,
    large: columnProps,
    extraLarge: columnProps,
    border: PropTypes.bool,
    onPanelClick: PropTypes.func,
    onMouseOver: PropTypes.func,
    onMouseOut: PropTypes.func
};

AnterosPanel.defaultProps = {
    outline: false,
    withScroll: true,
    border: true
}

export default AnterosPanel;
