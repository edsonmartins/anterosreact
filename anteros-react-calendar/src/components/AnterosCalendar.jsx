import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Months from './YearView/Months';
import Years from './DecadeView/Years';
import Decades from './CenturyView/Decades';
import { getTileClasses } from './shared/utils';
import { tileGroupProps } from './shared/propTypes';
import mergeClassNames from 'merge-class-names';
import { tileProps } from './shared/propTypes';
import Navigation from './Calendar/Navigation';
import {
    getBegin, getBeginNext, getEnd, getValueRange,
} from './shared/dates';
import {
    isCalendarType, isClassName, isMaxDate, isMinDate, isValue, isView,
} from './shared/propTypes';
import { between, callIfDefined } from './shared/utils';
import Days from './MonthView/Days';
import Weekdays from './MonthView/Weekdays';
import WeekNumbers from './MonthView/WeekNumbers';
import { CALENDAR_TYPES, CALENDAR_TYPE_LOCALES } from './shared/const';

export function YearView(props) {
    function renderMonths() {
        return (
            <Months {...props} />
        );
    }

    return (
        <div className="react-calendar__year-view">
            {renderMonths()}
        </div>
    );
}

export function TileGroup({
    className,
    count = 3,
    dateTransform,
    dateType,
    end,
    hover,
    offset,
    start,
    step = 1,
    tile: Tile,
    value,
    valueType,
    ...tileProps
}) {
    const tiles = [];
    for (let point = start; point <= end; point += step) {
        const date = dateTransform(point);

        tiles.push(
            <Tile
                key={date.getTime()}
                classes={getTileClasses({
                    value, valueType, date, dateType, hover,
                })}
                date={date}
                point={point}
                {...tileProps}
            />,
        );
    }

    return (
        <Flex
            className={className}
            count={count}
            offset={offset}
            wrap
        >
            {tiles}
        </Flex>
    );
}

TileGroup.propTypes = {
    ...tileGroupProps,
    activeStartDate: PropTypes.instanceOf(Date),
    count: PropTypes.number,
    dateTransform: PropTypes.func.isRequired,
    offset: PropTypes.number,
    step: PropTypes.number,
    tile: PropTypes.func.isRequired,
};



function getValueTile(nextProps, prop) {
    const { activeStartDate, date, view } = nextProps;

    return typeof prop === 'function'
        ? prop({ activeStartDate, date, view })
        : prop;
}

export class Tile extends Component {
    static getDerivedStateFromProps(nextProps, prevState) {
        const { tileClassName, tileContent } = nextProps;

        const nextState = {};

        if (tileClassName !== prevState.tileClassNameProps) {
            nextState.tileClassName = getValueTile(nextProps, tileClassName);
            nextState.tileClassNameProps = tileClassName;
        }

        if (tileContent !== prevState.tileContentProps) {
            nextState.tileContent = getValueTile(nextProps, tileContent);
            nextState.tileContentProps = tileContent;
        }

        return nextState;
    }

    state = {};

    render() {
        const {
            activeStartDate,
            children,
            classes,
            date,
            formatAbbr,
            locale,
            maxDate,
            maxDateTransform,
            minDate,
            minDateTransform,
            onClick,
            onMouseOver,
            style,
            tileDisabled,
            view,
        } = this.props;
        const { tileClassName, tileContent } = this.state;

        return (
            <button
                className={mergeClassNames(classes, tileClassName)}
                disabled={
                    (minDate && minDateTransform(minDate) > date)
                    || (maxDate && maxDateTransform(maxDate) < date)
                    || (tileDisabled && tileDisabled({ activeStartDate, date, view }))
                }
                onClick={onClick && (event => onClick(date, event))}
                onFocus={onMouseOver && (() => onMouseOver(date))}
                onMouseOver={onMouseOver && (() => onMouseOver(date))}
                style={style}
                type="button"
            >
                {formatAbbr
                    ? (
                        <abbr aria-label={formatAbbr(locale, date)}>
                            {children}
                        </abbr>
                    )
                    : children}
                {tileContent}
            </button>
        );
    }
}

Tile.propTypes = {
    ...tileProps,
    children: PropTypes.node.isRequired,
    formatAbbr: PropTypes.func,
    maxDateTransform: PropTypes.func.isRequired,
    minDateTransform: PropTypes.func.isRequired,
};





function getCalendarTypeFromLocale(locale) {
    return (
        Object.keys(CALENDAR_TYPE_LOCALES)
            .find(calendarType => CALENDAR_TYPE_LOCALES[calendarType].includes(locale))
        || CALENDAR_TYPES.ISO_8601
    );
}

export function MonthView(props) {
    const {
        activeStartDate,
        locale,
        onMouseLeave,
        showFixedNumberOfWeeks,
    } = props;
    const {
        calendarType = getCalendarTypeFromLocale(locale),
        formatShortWeekday,
        onClickWeekNumber,
        showWeekNumbers,
        ...childProps
    } = props;

    function renderWeekdays() {
        return (
            <Weekdays
                calendarType={calendarType}
                formatShortWeekday={formatShortWeekday}
                locale={locale}
                onMouseLeave={onMouseLeave}
            />
        );
    }

    function renderWeekNumbers() {
        if (!showWeekNumbers) {
            return null;
        }

        return (
            <WeekNumbers
                activeStartDate={activeStartDate}
                calendarType={calendarType}
                onClickWeekNumber={onClickWeekNumber}
                onMouseLeave={onMouseLeave}
                showFixedNumberOfWeeks={showFixedNumberOfWeeks}
            />
        );
    }

    function renderDays() {
        return (
            <Days
                calendarType={calendarType}
                {...childProps}
            />
        );
    }

    const className = 'react-calendar__month-view';

    return (
        <div
            className={[
                className,
                showWeekNumbers ? `${className}--weekNumbers` : '',
            ].join(' ')}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                }}
            >
                {renderWeekNumbers()}
                <div
                    style={{
                        flexGrow: 1,
                        width: '100%',
                    }}
                >
                    {renderWeekdays()}
                    {renderDays()}
                </div>
            </div>
        </div>
    );
}

MonthView.propTypes = {
    activeStartDate: PropTypes.instanceOf(Date).isRequired,
    calendarType: isCalendarType,
    formatShortWeekday: PropTypes.func,
    locale: PropTypes.string,
    onClickWeekNumber: PropTypes.func,
    onMouseLeave: PropTypes.func,
    showFixedNumberOfWeeks: PropTypes.bool,
    showWeekNumbers: PropTypes.bool,
};



function toPercent(num) {
    return `${num}%`;
}

export function Flex({
    children,
    className,
    direction,
    count,
    offset,
    style,
    wrap,
    ...otherProps
}) {
    return (
        <div
            className={className}
            style={{
                display: 'flex',
                flexDirection: direction,
                flexWrap: wrap ? 'wrap' : 'no-wrap',
                ...style,
            }}
            {...otherProps}
        >
            {React.Children.map(children, (child, index) => (
                React.cloneElement(
                    child,
                    {
                        ...child.props,
                        style: {
                            flexBasis: toPercent(100 / count),
                            maxWidth: toPercent(100 / count),
                            overflow: 'hidden',
                            marginLeft: offset && (index === 0) ? toPercent((100 * offset) / count) : null,
                        },
                    },
                )
            ))}
        </div>
    );
}

Flex.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    count: PropTypes.number.isRequired,
    direction: PropTypes.string,
    offset: PropTypes.number,
    style: PropTypes.objectOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ])),
    wrap: PropTypes.bool,
};


export function DecadeView(props) {
    function renderYears() {
        return (
            <Years {...props} />
        );
    }

    return (
        <div className="react-calendar__decade-view">
            {renderYears()}
        </div>
    );
}



export function CenturyView(props) {
    function renderDecades() {
        return (
            <Decades {...props} />
        );
    }

    return (
        <div className="react-calendar__century-view">
            {renderDecades()}
        </div>
    );
}




const baseClassName = 'react-calendar';
const allViews = ['century', 'decade', 'year', 'month'];
const allValueTypes = [...allViews.slice(1), 'day'];

/**
 * Returns views array with disallowed values cut off.
 */
function getLimitedViews(minDetail, maxDetail) {
    return allViews.slice(allViews.indexOf(minDetail), allViews.indexOf(maxDetail) + 1);
}

/**
 * Determines whether a given view is allowed with currently applied settings.
 */
function isViewAllowed(view, minDetail, maxDetail) {
    const views = getLimitedViews(minDetail, maxDetail);

    return views.indexOf(view) !== -1;
}

/**
 * Gets either provided view if allowed by minDetail and maxDetail, or gets
 * the default view if not allowed.
 */
function getView(view, minDetail, maxDetail) {
    if (isViewAllowed(view, minDetail, maxDetail)) {
        return view;
    }

    return maxDetail;
}

/**
 * Returns value type that can be returned with currently applied settings.
 */
function getValueType(maxDetail) {
    return allValueTypes[allViews.indexOf(maxDetail)];
}

function getValue(value, index) {
    if (!value) {
        return null;
    }

    const rawValue = value instanceof Array && value.length === 2 ? value[index] : value;

    if (!rawValue) {
        return null;
    }

    const valueDate = new Date(rawValue);

    if (isNaN(valueDate.getTime())) {
        throw new Error(`Invalid date: ${value}`);
    }

    return valueDate;
}

function getDetailValue({
    value, minDate, maxDate, maxDetail,
}, index) {
    const valuePiece = getValue(value, index);

    if (!valuePiece) {
        return null;
    }

    const valueType = getValueType(maxDetail);
    const detailValueFrom = [getBegin, getEnd][index](valueType, valuePiece);

    return between(detailValueFrom, minDate, maxDate);
}

const getDetailValueFrom = args => getDetailValue(args, 0);

const getDetailValueTo = args => getDetailValue(args, 1);

const getDetailValueArray = (args) => {
    const { value } = args;

    if (value instanceof Array) {
        return value;
    }

    return [getDetailValueFrom, getDetailValueTo].map(fn => fn(args));
};

function getActiveStartDate(props) {
    const {
        maxDate,
        maxDetail,
        minDate,
        minDetail,
        value,
        view,
    } = props;

    const rangeType = getView(view, minDetail, maxDetail);
    const valueFrom = (
        getDetailValueFrom({
            value, minDate, maxDate, maxDetail,
        })
        || new Date()
    );

    return getBegin(rangeType, valueFrom);
}

function getInitialActiveStartDate(props) {
    const {
        activeStartDate,
        defaultActiveStartDate,
        defaultValue,
        defaultView,
        maxDetail,
        minDetail,
        value,
        view,
        ...otherProps
    } = props;

    const rangeType = getView(view, minDetail, maxDetail);
    const valueFrom = activeStartDate || defaultActiveStartDate;

    if (valueFrom) {
        return getBegin(rangeType, valueFrom);
    }

    return getActiveStartDate({
        maxDetail,
        minDetail,
        value: value || defaultValue,
        view: view || defaultView,
        ...otherProps,
    });
}

const isSingleValue = value => value && [].concat(value).length === 1;

export default class AnterosCalendar extends Component {
    state = {
        /* eslint-disable react/destructuring-assignment */
        activeStartDate: this.props.defaultActiveStartDate,
        value: this.props.defaultValue,
        view: this.props.defaultView,
        /* eslint-enable react/destructuring-assignment */
    };

    get activeStartDate() {
        const { activeStartDate: activeStartDateProps } = this.props;
        const { activeStartDate: activeStartDateState } = this.state;

        return activeStartDateProps || activeStartDateState || getInitialActiveStartDate(this.props);
    }

    get value() {
        const { selectRange, value: valueProps } = this.props;
        const { value: valueState } = this.state;

        // In the middle of range selection, use value from state
        if (selectRange && isSingleValue(valueState)) {
            return valueState;
        }

        return valueProps !== undefined ? valueProps : valueState;
    }

    get valueType() {
        const { maxDetail } = this.props;

        return getValueType(maxDetail);
    }

    get view() {
        const { minDetail, maxDetail, view: viewProps } = this.props;
        const { view: viewState } = this.state;

        return getView(viewProps || viewState, minDetail, maxDetail);
    }

    get views() {
        const { minDetail, maxDetail } = this.props;

        return getLimitedViews(minDetail, maxDetail);
    }

    get hover() {
        const { selectRange } = this.props;
        const { hover } = this.state;

        return selectRange ? hover : null;
    }

    get drillDownAvailable() {
        const { view, views } = this;

        return views.indexOf(view) < views.length - 1;
    }

    get drillUpAvailable() {
        const { view, views } = this;

        return views.indexOf(view) > 0;
    }

    /**
     * Gets current value in a desired format.
     */
    getProcessedValue(value) {
        const {
            minDate, maxDate, maxDetail, returnValue,
        } = this.props;

        const processFunction = (() => {
            switch (returnValue) {
                case 'start': return getDetailValueFrom;
                case 'end': return getDetailValueTo;
                case 'range': return getDetailValueArray;
                default: throw new Error('Invalid returnValue.');
            }
        })();

        return processFunction({
            value, minDate, maxDate, maxDetail,
        });
    }

    setStateAndCallCallbacks = (nextState, callback) => {
        const {
            activeStartDate: previousActiveStartDate,
            view: previousView,
        } = this;

        const {
            onActiveStartDateChange, onChange, onViewChange, selectRange,
        } = this.props;

        const prevArgs = {
            activeStartDate: previousActiveStartDate,
            view: previousView,
        };

        this.setState(nextState, () => {
            const args = {
                activeStartDate: nextState.activeStartDate || this.activeStartDate,
                view: nextState.view || this.view,
            };

            function shouldUpdate(key) {
                return (
                    // Key must exist, and…
                    key in nextState
                    && (
                        // …key changed from undefined to defined or the other way around, or…
                        typeof nextState[key] !== typeof prevArgs[key]
                        // …value changed.
                        || (
                            nextState[key] instanceof Date
                                ? nextState[key].getTime() !== prevArgs[key].getTime()
                                : nextState[key] !== prevArgs[key]
                        )
                    )
                );
            }

            if (shouldUpdate('activeStartDate')) {
                callIfDefined(onActiveStartDateChange, args);
            }

            if (shouldUpdate('view')) {
                callIfDefined(onViewChange, args);
            }

            if (shouldUpdate('value')) {
                if (!selectRange || !isSingleValue(nextState.value)) {
                    callIfDefined(onChange, nextState.value);
                }
            }

            callIfDefined(callback, args);
        });
    }

    /**
     * Called when the user uses navigation buttons.
     */
    setActiveStartDate = (activeStartDate) => {
        this.setStateAndCallCallbacks({ activeStartDate });
    }

    drillDown = (nextActiveStartDate, event) => {
        if (!this.drillDownAvailable) {
            return;
        }

        this.onClickTile(nextActiveStartDate, event);

        const { view, views } = this;
        const { onDrillDown } = this.props;

        const nextView = views[views.indexOf(view) + 1];

        this.setStateAndCallCallbacks({
            activeStartDate: nextActiveStartDate,
            view: nextView,
        }, onDrillDown);
    }

    drillUp = () => {
        if (!this.drillUpAvailable) {
            return;
        }

        const { activeStartDate, view, views } = this;
        const { onDrillUp } = this.props;

        const nextView = views[views.indexOf(view) - 1];
        const nextActiveStartDate = getBegin(nextView, activeStartDate);

        this.setStateAndCallCallbacks({
            activeStartDate: nextActiveStartDate,
            view: nextView,
        }, onDrillUp);
    }

    onChange = (value, event) => {
        const { selectRange } = this.props;

        this.onClickTile(value, event);

        let nextValue;
        if (selectRange) {
            // Range selection turned on
            const { value: previousValue, valueType } = this;
            if (!isSingleValue(previousValue)) {
                // Value has 0 or 2 elements - either way we're starting a new array
                // First value
                nextValue = getBegin(valueType, value);
            } else {
                // Second value
                nextValue = getValueRange(valueType, previousValue, value);
            }
        } else {
            // Range selection turned off
            nextValue = this.getProcessedValue(value);
        }

        const nextActiveStartDate = getActiveStartDate({
            ...this.props,
            value: nextValue,
        });

        this.setStateAndCallCallbacks({
            activeStartDate: nextActiveStartDate,
            value: nextValue,
        });
    }

    onClickTile = (value, event) => {
        const { view } = this;
        const {
            onClickDay,
            onClickDecade,
            onClickMonth,
            onClickYear,
        } = this.props;

        const callback = (() => {
            switch (view) {
                case 'century':
                    return onClickDecade;
                case 'decade':
                    return onClickYear;
                case 'year':
                    return onClickMonth;
                case 'month':
                    return onClickDay;
                default:
                    throw new Error(`Invalid view: ${view}.`);
            }
        })();

        callIfDefined(callback, value, event);
    }

    onMouseOver = (value) => {
        this.setState((prevState) => {
            if (prevState.hover && (prevState.hover.getTime() === value.getTime())) {
                return null;
            }

            return { hover: value };
        });
    }

    onMouseLeave = () => {
        this.setState({ hover: null });
    }

    renderContent(next) {
        const {
            activeStartDate: currentActiveStartDate,
            onMouseOver,
            valueType,
            value,
            view,
        } = this;
        const {
            calendarType,
            locale,
            maxDate,
            minDate,
            selectRange,
            tileClassName,
            tileContent,
            tileDisabled,
        } = this.props;
        const { hover } = this;

        const activeStartDate = (
            next
                ? getBeginNext(view, currentActiveStartDate)
                : getBegin(view, currentActiveStartDate)
        );

        const onClick = this.drillDownAvailable ? this.drillDown : this.onChange;

        const commonProps = {
            activeStartDate,
            hover,
            locale,
            maxDate,
            minDate,
            onClick,
            onMouseOver: selectRange ? onMouseOver : null,
            tileClassName,
            tileContent,
            tileDisabled,
            value,
            valueType,
        };

        switch (view) {
            case 'century': {
                const { formatYear } = this.props;

                return (
                    <CenturyView
                        formatYear={formatYear}
                        {...commonProps}
                    />
                );
            }
            case 'decade': {
                const { formatYear } = this.props;

                return (
                    <DecadeView
                        formatYear={formatYear}
                        {...commonProps}
                    />
                );
            }
            case 'year': {
                const { formatMonth, formatMonthYear } = this.props;

                return (
                    <YearView
                        formatMonth={formatMonth}
                        formatMonthYear={formatMonthYear}
                        {...commonProps}
                    />
                );
            }
            case 'month': {
                const {
                    formatLongDate,
                    formatShortWeekday,
                    onClickWeekNumber,
                    showDoubleView,
                    showFixedNumberOfWeeks,
                    showNeighboringMonth,
                    showWeekNumbers,
                } = this.props;
                const { onMouseLeave } = this;

                return (
                    <MonthView
                        calendarType={calendarType}
                        formatLongDate={formatLongDate}
                        formatShortWeekday={formatShortWeekday}
                        onClickWeekNumber={onClickWeekNumber}
                        onMouseLeave={onMouseLeave}
                        showFixedNumberOfWeeks={showFixedNumberOfWeeks || showDoubleView}
                        showNeighboringMonth={showNeighboringMonth}
                        showWeekNumbers={showWeekNumbers}
                        {...commonProps}
                    />
                );
            }
            default:
                throw new Error(`Invalid view: ${view}.`);
        }
    }

    renderNavigation() {
        const { showNavigation } = this.props;

        if (!showNavigation) {
            return null;
        }

        const { activeStartDate, view, views } = this;
        const {
            formatMonthYear,
            formatYear,
            locale,
            maxDate,
            minDate,
            navigationAriaLabel,
            navigationLabel,
            next2AriaLabel,
            next2Label,
            nextAriaLabel,
            nextLabel,
            prev2AriaLabel,
            prev2Label,
            prevAriaLabel,
            prevLabel,
            showDoubleView,
        } = this.props;

        return (
            <Navigation
                activeStartDate={activeStartDate}
                drillUp={this.drillUp}
                formatMonthYear={formatMonthYear}
                formatYear={formatYear}
                locale={locale}
                maxDate={maxDate}
                minDate={minDate}
                navigationAriaLabel={navigationAriaLabel}
                navigationLabel={navigationLabel}
                next2AriaLabel={next2AriaLabel}
                next2Label={next2Label}
                nextAriaLabel={nextAriaLabel}
                nextLabel={nextLabel}
                prev2AriaLabel={prev2AriaLabel}
                prev2Label={prev2Label}
                prevAriaLabel={prevAriaLabel}
                prevLabel={prevLabel}
                setActiveStartDate={this.setActiveStartDate}
                showDoubleView={showDoubleView}
                view={view}
                views={views}
            />
        );
    }

    render() {
        const { className, selectRange, showDoubleView } = this.props;
        const { onMouseLeave, value } = this;
        const valueArray = [].concat(value);

        return (
            <div
                className={mergeClassNames(
                    baseClassName,
                    selectRange && valueArray.length === 1 && `${baseClassName}--selectRange`,
                    showDoubleView && `${baseClassName}--doubleView`,
                    className,
                )}
            >
                {this.renderNavigation()}
                <div
                    className={`${baseClassName}__viewContainer`}
                    onBlur={selectRange ? onMouseLeave : null}
                    onMouseLeave={selectRange ? onMouseLeave : null}
                >
                    {this.renderContent()}
                    {showDoubleView && this.renderContent(true)}
                </div>
            </div>
        );
    }
}

AnterosCalendar.defaultProps = {
    maxDetail: 'month',
    minDetail: 'century',
    returnValue: 'start',
    showNavigation: true,
    showNeighboringMonth: true,
};

const isActiveStartDate = PropTypes.instanceOf(Date);
const isLooseValue = PropTypes.oneOfType([
    PropTypes.string,
    isValue,
]);

AnterosCalendar.propTypes = {
    activeStartDate: isActiveStartDate,
    calendarType: isCalendarType,
    className: isClassName,
    defaultActiveStartDate: isActiveStartDate,
    defaultValue: isLooseValue,
    defaultView: isView,
    formatLongDate: PropTypes.func,
    formatMonth: PropTypes.func,
    formatMonthYear: PropTypes.func,
    formatShortWeekday: PropTypes.func,
    formatYear: PropTypes.func,
    locale: PropTypes.string,
    maxDate: isMaxDate,
    maxDetail: PropTypes.oneOf(allViews),
    minDate: isMinDate,
    minDetail: PropTypes.oneOf(allViews),
    navigationAriaLabel: PropTypes.string,
    navigationLabel: PropTypes.func,
    next2AriaLabel: PropTypes.string,
    next2Label: PropTypes.node,
    nextAriaLabel: PropTypes.string,
    nextLabel: PropTypes.node,
    onActiveStartDateChange: PropTypes.func,
    onChange: PropTypes.func,
    onClickDay: PropTypes.func,
    onClickDecade: PropTypes.func,
    onClickMonth: PropTypes.func,
    onClickWeekNumber: PropTypes.func,
    onClickYear: PropTypes.func,
    onDrillDown: PropTypes.func,
    onDrillUp: PropTypes.func,
    onViewChange: PropTypes.func,
    prev2AriaLabel: PropTypes.string,
    prev2Label: PropTypes.node,
    prevAriaLabel: PropTypes.string,
    prevLabel: PropTypes.node,
    returnValue: PropTypes.oneOf(['start', 'end', 'range']),
    selectRange: PropTypes.bool,
    showDoubleView: PropTypes.bool,
    showFixedNumberOfWeeks: PropTypes.bool,
    showNavigation: PropTypes.bool,
    showNeighboringMonth: PropTypes.bool,
    showWeekNumbers: PropTypes.bool,
    tileClassName: PropTypes.oneOfType([
        PropTypes.func,
        isClassName,
    ]),
    tileContent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.node,
    ]),
    tileDisabled: PropTypes.func,
    value: isLooseValue,
    view: isView,
};

