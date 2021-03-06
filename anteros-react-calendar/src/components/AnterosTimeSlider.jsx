import { Component } from 'react';
import * as React from 'react';
var TimeSlider = require('./AnterosTimeSlider.js');
import './timeslider.css';
import lodash from "lodash";
import PropTypes from 'prop-types';

export default class AnterosTimeSlider extends React.Component {
    constructor(props) {
        super(props);
        this.idTimeSlider = lodash.uniqueId("timeSlider");
    }

    componentWillReceiveProps(nextProps) {}

    componentDidMount() {
        let _this = this;
        $(this.divTimeSlider).TimeSlider({
            start_timestamp: this.props.startTimestamp,
            current_timestamp: this.props.currentTimestamp,
            hours_per_ruler: this.props.hoursPerRuler,
            graduation_step: this.props.graduationStep,
            distance_between_gtitle: this.props.distance_between_gtitle,
            update_timestamp_interval: this.props.update_timestamp_interval,
            update_interval: this.props.update_timestamp_interval,
            show_ms: this.props.showMs,
            init_cells: this.props.initCells,
            ruler_enable_move: this.props.rulerEnableMove,
            timecell_enable_move: this.props.timecellEnableMove,
            timecell_enable_resize: this.props.timecellEnableResize,
            on_add_timecell_callback: this.props.onAddTimecell,
            on_toggle_timecell_callback: this.onToggleTimecell,
            on_remove_timecell_callback: this.props.onRemoveTimecell,
            on_remove_all_timecells_callback: this.props.onRemoveAllTimecells,
            on_dblclick_timecell_callback: this.props.onDblclickTimecell,
            on_move_timecell_callback: this.props.onMovetimecell,
            on_resize_timecell_callback: this.props.onResizeTimecell,
            on_change_timecell_callback: this.props.onChangeTimecell,
            on_dblclick_ruler_callback: this.props.onDblclickRuler,
            on_move_ruler_callback: this.props.onMoveRuler,
            on_change_ruler_callback: this.props.onChangeRuler
        });

    }

    componentWillUnmount() {}

    render() {
        if (this.props.id) {
            this.idTimeSlider = this.props.id;
        }
        return (<div className="time-slider"
            id={this.idTimeSlider}
            ref={ref => this.divTimeSlider = ref}
            style={{
            ...this.props.style
        }}/>);
    }
}

AnterosTimeSlider.propTypes = {
    startTimestamp: PropTypes.number,
    currentTimestamp: PropTypes.number,
    hoursPerRuler: PropTypes.number,
    graduationStep: PropTypes.number,
    distanceBetweenGtitle: PropTypes.number,
    updateTimestampInterval: PropTypes.number,
    updateInterval: PropTypes.number,
    showMs: PropTypes.bool,
    initCells: PropTypes.object,
    rulerEnableMove: PropTypes.bool,
    timecellEnableMove: PropTypes.bool,
    timecellEnableResize: PropTypes.bool,
    onAddTimecell: PropTypes.function,
    onToggleTimecell: PropTypes.function,
    onRemoveTimecell: PropTypes.function,
    onRemoveAllTimecells: PropTypes.function,
    onDblclickTimecell: PropTypes.function,
    onMovetimecell: PropTypes.function,
    onResizeTimecell: PropTypes.function,
    onChangeTimecell: PropTypes.function,
    onDblclickRuler: PropTypes.function,
    onMoveRuler: PropTypes.function,
    onChangeRuler: PropTypes.function
};

AnterosTimeSlider.defaultProps = {
    hoursPerRuler: 24,
    graduationStep: 20,
    distanceBetweenGtitle: 80,
    updateTimestampInterval: 1000,
    updateInterval: 1000,
    showMs: false,
    rulerEnableMove: true,
    timecellEnableMove: true,
    timecellEnableResize: true
}