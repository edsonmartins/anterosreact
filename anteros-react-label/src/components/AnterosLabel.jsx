import React, { Component } from 'react';
import {AnterosUtils} from "@anterostecnologia/anteros-react-core";
import { buildGridClassNames, columnProps } from "@anterostecnologia/anteros-react-layout";
import PropTypes from 'prop-types';

export default class AnterosLabel extends Component {

    constructor(props) {
        super(props);
    }
    render() {
        const colClasses = buildGridClassNames(this.props, false, []);
        let className;
        if (colClasses.length > 0)
            className = AnterosUtils.buildClassNames("control-label", colClasses);
            
        return (<label style={{...this.props.style, textAlign: this.props.textAlign }} className={className}>{this.props.caption}</label>);
    }
}

AnterosLabel.propTypes = {
    caption: PropTypes.string.isRequired,
    textAlign: PropTypes.oneOf(['left', 'right', 'center', 'start', 'end']),
    extraSmall: columnProps,
    small: columnProps,
    medium: columnProps,
    large: columnProps,
    extraLarge: columnProps,
    style : PropTypes.object
}

AnterosLabel.defaultProps = {
}



