import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';

import { AnterosRemoteDatasource, dataSourceEvents, dataSourceConstants, DATASOURCE_EVENTS } from 'anteros-react-datasource';
import { AnterosSweetAlert, AnterosError, autoBind, processErrorMessage, AnterosResizeDetector } from 'anteros-react-core';
import { AnterosQueryBuilder, AnterosFilterDSL, AnterosQueryBuilderData } from 'anteros-react-querybuilder';
import { AnterosCard, HeaderActions, FooterActions } from 'anteros-react-containers';
import { AnterosBlockUi, AnterosLoader } from 'anteros-react-loaders';
import { AnterosCol, AnterosRow } from 'anteros-react-layout';
import { AnterosPagination } from 'anteros-react-navigation';
import { AnterosAlert } from 'anteros-react-notification';
import { AnterosDataTable } from 'anteros-react-table';
import { AnterosButton } from 'anteros-react-buttons';
import { AnterosLabel } from 'anteros-react-label';

const defaultValues = {
    openDataSourceFilter: true,
    openMainDataSource: true,
    messageLoading: 'Por favor aguarde...',
    withFilter: true,
    fieldsToForceLazy: '',
    defaultSortFields: '',
    layoutReducerName: 'layoutReducer'
};

export default function WithTableContainerTemplate(_loadingProps) {
    let loadingProps = { ...defaultValues, ..._loadingProps };

    const mapStateToProps = state => {
        let dataSource,
            query,
            sort,
            activeSortIndex,
            activeFilter,
            quickFilterText,
            needRefresh = false,
            needUpdateView = false,
            user;
        let reducer = state[loadingProps.reducerName];
        if (reducer) {
            dataSource = reducer.dataSource;
            query = reducer.query;
            sort = reducer.sort;
            activeSortIndex = reducer.activeSortIndex;
            activeFilter = reducer.activeFilter;
            quickFilterText = reducer.quickFilterText;
            needRefresh = reducer.needRefresh;
        }
        user = state[loadingProps.userReducerName].user;
        reducer = state[loadingProps.layoutReducerName];
        if (reducer) {
            needUpdateView = reducer.needUpdateView;
        }

        return {
            dataSource: dataSource,
            query: query,
            sort: sort,
            activeSortIndex: activeSortIndex,
            activeFilter: activeFilter,
            quickFilterText: quickFilterText,
            user: user,
            needRefresh: needRefresh,
            needUpdateView: needUpdateView
        };
    };

    const mapDispatchToProps = dispatch => {
        return {
            setDatasource: dataSource => {
                dispatch(loadingProps.actions.setDatasource(dataSource));
            },
            setFilter: (
                activeFilter,
                query,
                sort,
                activeSortIndex,
                quickFilterText
            ) => {
                dispatch(
                    loadingProps.actions.setFilter(
                        activeFilter,
                        query,
                        sort,
                        activeSortIndex,
                        quickFilterText
                    )
                );
            }
        };
    };

    return WrappedComponent => {
        class TableContainerView extends WrappedComponent {
            constructor(props, context) {
                super(props);
                autoBind(this);
                if (!loadingProps.endPoints) {
                    throw new AnterosError(
                        'Informe o objeto com os endPoints de consulta.'
                    );
                }
                if (!loadingProps.resource) {
                    throw new AnterosError('Informe o nome do RESOURCE de consulta. ');
                }
                if (!loadingProps.reducerName) {
                    throw new AnterosError('Informe o nome do REDUCER. ');
                }
                if (!loadingProps.userReducerName) {
                    throw new AnterosError('Informe o nome do REDUCER de Usuários. ');
                }
                if (!loadingProps.actions) {
                    throw new AnterosError(
                        'Informe o objeto com as actions do REDUCER. '
                    );
                }
                if (!loadingProps.viewName) {
                    throw new AnterosError('Informe o nome da View. ');
                }
                if (!loadingProps.caption) {
                    throw new AnterosError('Informe o caption(titulo) da View. ');
                }
                if (loadingProps.withFilter && !loadingProps.filterName) {
                    throw new AnterosError('Informe o nome do filtro. ');
                }
                if (!loadingProps.routes) {
                    throw new AnterosError('Informe as rotas das ações. ');
                }

                if (WrappedComponent.prototype.hasOwnProperty('getColumns') === false) {
                    throw new AnterosError('Implemente o método getColumns na classe.');
                }

                if (WrappedComponent.prototype.hasOwnProperty('getRoutes') && this.getRoutes()) {
                    loadingProps.routes = this.getRoutes();
                }

                if (
                    WrappedComponent.prototype.hasOwnProperty('getFieldsFilter') === false
                ) {
                    throw new AnterosError(
                        'Implemente o método getFieldsFilter na classe '
                    );
                }

                this.filterRef = React.createRef();

                this.hasUserActions = WrappedComponent.prototype.hasOwnProperty(
                    'getUserActions'
                );

                this.positionUserActions =
                    WrappedComponent.prototype.hasOwnProperty(
                        'getPositionUserActions'
                    ) === true
                        ? this.getPositionUserActions()
                        : 'first';

                this.createDataSourceFilter();

                if (
                    WrappedComponent.prototype.hasOwnProperty(
                        'onCreateDatasource'
                    ) === true
                ) {
                    this.dataSource = this.onCreateDatasource();
                    if (this.dataSource instanceof AnterosRemoteDatasource) {
                        this.dataSource.setAjaxPageConfigHandler(this.pageConfigHandler);
                    }
                    this.dataSource.addEventListener(
                        DATASOURCE_EVENTS,
                        this.onDatasourceEvent
                    );
                } else {
                    this.createMainDataSource();
                }

                if (WrappedComponent.prototype.hasOwnProperty('getRoutes') && this.getRoutes()) {
                    loadingProps.routes = this.getRoutes();
                }

                this.state = {
                    dataSource: [],
                    alertIsOpen: false,
                    alertMessage: '',
                    loading: false,
                    width: undefined,
                    newHeight: undefined,
                    update: Math.random()
                };
            }

            createDataSourceFilter() {
                this.dsFilter = new AnterosRemoteDatasource();
                AnterosQueryBuilderData.configureDatasource(this.dsFilter);
            }

            getDispatch() {
                return this.props.dispatch;
            }

            getUser() {
                if (this.props.user) {
                    return this.props.user;
                }
                return undefined;
            }

            refreshData(page) {
                var p = page;
                if (page === undefined || page === null) {
                    p = 0;
                }

                if (WrappedComponent.prototype.hasOwnProperty('onFindAll') === true) {
                    return this.onFindAll(p, loadingProps.pageSize,
                        this.getSortFields(),
                        this.getUser(), loadingProps.fieldsToForceLazy);
                } else {
                    return loadingProps.endPoints.FIND_ALL(
                        loadingProps.resource,
                        p,
                        loadingProps.pageSize,
                        this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                    );
                }
            }

            createMainDataSource() {
                if (this.props.dataSource) {
                    this.dataSource = this.props.dataSource;
                    if (this.dataSource.getState() !== dataSourceConstants.DS_BROWSE) {
                        this.dataSource.cancel();
                    }
                } else {
                    this.dataSource = new AnterosRemoteDatasource();
                    this.dataSource.setAjaxPostConfigHandler(entity => {
                        return loadingProps.endPoints.POST(loadingProps.resource, entity, this.getUser());
                    });
                    this.dataSource.setValidatePostResponse(response => {
                        return response.data !== undefined;
                    });
                    this.dataSource.setAjaxDeleteConfigHandler(entity => {
                        return loadingProps.endPoints.DELETE(loadingProps.resource, entity, this.getUser());
                    });
                    this.dataSource.setValidateDeleteResponse(response => {
                        return response.data !== undefined;
                    });
                }

                this.dataSource.setAjaxPageConfigHandler(this.pageConfigHandler);
                this.dataSource.addEventListener(
                    DATASOURCE_EVENTS,
                    this.onDatasourceEvent
                );
            }

            componentDidMount() {
                if (loadingProps.openDataSourceFilter) {
                    if (!this.dsFilter.isOpen()) {
                        this.dsFilter.open(
                            AnterosQueryBuilderData.getFilters(
                                loadingProps.viewName,
                                loadingProps.filterName
                            )
                        );
                    }
                }

                if (loadingProps.openMainDataSource) {
                    if (!this.dataSource.isOpen()) {
                        if (WrappedComponent.prototype.hasOwnProperty('onFindAll') === true) {
                            this.dataSource.open(this.onFindAll(0, loadingProps.pageSize, this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy));
                        } else {
                            this.dataSource.open(
                                loadingProps.endPoints.FIND_ALL(
                                    loadingProps.resource,
                                    0,
                                    loadingProps.pageSize,
                                    this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                                )
                            );
                        }
                    } else if (this.props.needRefresh) {
                        this.dataSource.open(this.refreshData(this.dataSource.getCurrentPage()));
                    }
                    if (this.dataSource.getState() !== dataSourceConstants.DS_BROWSE) {
                        this.dataSource.cancel();
                    }
                }

                if (this.table1) {
                    this.table1.refreshData();
                }
                if (this.table2) {
                    this.table2.refreshData();
                }

                if (WrappedComponent.prototype.hasOwnProperty('onDidMount') === true) {
                    this.onDidMount();
                }

            }

            componentWillUnmount() {
                if (this.dataSource) {
                    this.dataSource.removeEventListener(
                        DATASOURCE_EVENTS,
                        this.onDatasourceEvent
                    );
                    if (this.dataSource instanceof AnterosRemoteDatasource) {
                        this.dataSource.setAjaxPageConfigHandler(null);
                    }
                }
                if (WrappedComponent.prototype.hasOwnProperty('onWillUnmount') === true) {
                    this.onWillUnmount();
                }
            }
            componentWillReceiveProps(nextProps) {
                this.onResize(
                    this.card.getCardBlockWidth(),
                    this.card.getCardBlockHeight()
                  );

                if (this.dataSource) {
                    if (this.table1) {
                        this.table1.refreshData();
                    }
                    if (this.table2) {
                        this.table2.refreshData();
                    }
                }
            }

            onQueryChange(query) {
                this.props.setFilter(
                    this.props.activeFilter,
                    query,
                    this.props.sort,
                    this.props.activeSortIndex,
                    this.props.quickFilterText
                );
            }

            onSortChange(sort, activeSortIndex) {
                this.props.setFilter(
                    this.props.activeFilter,
                    this.props.query,
                    sort,
                    activeSortIndex,
                    this.props.quickFilterText
                );
            }

            onSelectActiveFilter(
                activeFilter,
                filter,
                sort,
                activeSortIndex,
                quickFilterText
            ) {
                this.props.setFilter(
                    activeFilter,
                    filter,
                    sort,
                    activeSortIndex,
                    quickFilterText
                );
            }
            onBeforePageChanged(currentPage, newPage) {
                this.setState({
                    ...this.state,
                    loading: true
                });
            }

            handlePageChanged(newPage) {
                this.setState({
                    ...this.state,
                    currentPage: newPage,
                    loading: false
                });
            }

            onQuickFilter(filter, fields, sort) {
                if (WrappedComponent.prototype.hasOwnProperty('onFindMultipleFields') === true) {
                    this.dataSource.open(this.onFindMultipleFields(filter, fields, 0, loadingProps.pageSize, sort, this.getUser(), loadingProps.fieldsToForceLazy));
                } else {
                    this.dataSource.open(
                        loadingProps.endPoints.FIND_MULTIPLE_FIELDS(
                            loadingProps.resource,
                            filter,
                            fields,
                            0,
                            loadingProps.pageSize,
                            sort, this.getUser(), loadingProps.fieldsToForceLazy
                        )
                    );
                }
            }

            getSortFields() {
                if (loadingProps.withFilter && this.filterRef && this.filterRef.current) {
                    if (this.filterRef.current.getQuickFilterSort() && this.filterRef.current.getQuickFilterSort() !== '') {
                        return this.filterRef.current.getQuickFilterSort();
                    }
                }
                return loadingProps.defaultSortFields;
            }

            onDatasourceEvent(event, error) {
                let loading = this.state.loading;
                if (
                    event === dataSourceEvents.BEFORE_OPEN ||
                    event === dataSourceEvents.BEFORE_GOTO_PAGE
                ) {
                    loading = true;
                }

                if (event === dataSourceEvents.BEFORE_POST) {
                    if (WrappedComponent.prototype.hasOwnProperty('onBeforePost') === true) {
                        this.onBeforePost();
                    }
                }

                if (
                    event === dataSourceEvents.AFTER_OPEN ||
                    event === dataSourceEvents.AFTER_GOTO_PAGE ||
                    event === dataSourceEvents.ON_ERROR
                ) {
                    this.props.setDatasource(this.dataSource);
                    loading = false;
                }

                if (event === dataSourceEvents.AFTER_INSERT) {
                    if (WrappedComponent.prototype.hasOwnProperty('onAfterInsert') === true) {
                        this.onAfterInsert();
                    }
                }

                if (event === dataSourceEvents.ON_ERROR) {
                    if (error) {
                        this.setState({
                            ...this.state,
                            alertIsOpen: true,
                            loading: false,
                            alertMessage: processErrorMessage(error)
                        });
                    }
                } else {
                    this.setState({
                        ...this.state,
                        loading,
                        update: Math.random()
                    });
                }
            }

            onButtonClick(event, button) {
                if (button.props.id === 'btnView') {
                    if (WrappedComponent.prototype.hasOwnProperty('onCustomView') === true) {
                        this.onCustomView(button.props.route);
                        return;
                    }
                } else if (button.props.id === 'btnAdd') {
                    if (WrappedComponent.prototype.hasOwnProperty('onCustomAdd') === true) {
                        this.onCustomAdd(button.props.route);
                        return;
                    } else {
                        if (WrappedComponent.prototype.hasOwnProperty('onBeforeInsert') === true) {
                            if (!this.onBeforeInsert()) {
                                return;
                            }
                        }
                        if (!this.dataSource.isOpen())
                            this.dataSource.open();
                        this.dataSource.insert();
                    }
                } else if (button.props.id === 'btnEdit') {
                    if (WrappedComponent.prototype.hasOwnProperty('onCustomEdit') === true) {
                        this.onCustomEdit(button.props.route);
                        return;
                    } else {
                        if (WrappedComponent.prototype.hasOwnProperty('onBeforeEdit') === true) {
                            if (!this.onBeforeEdit()) {
                                return;
                            }
                        }

                        this.dataSource.edit();
                    }
                } else if (button.props.id === 'btnRemove') {
                    if (WrappedComponent.prototype.hasOwnProperty('onBeforeRemove') === true) {
                        if (!this.onBeforeRemove()) {
                            return;
                        }
                    }
                    let _this = this;
                    AnterosSweetAlert({
                        title: 'Deseja remover ?',
                        text: '',
                        type: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Sim',
                        cancelButtonText: 'Não',
                        focusCancel: true
                    })
                        .then(function () {
                            _this.dataSource.delete(error => {
                                if (error) {
                                    _this.setState({
                                        ..._this.state,
                                        alertIsOpen: true,
                                        alertMessage: processErrorMessage(error)
                                    });
                                }
                            });
                        })
                        .catch(error => { });
                } else if (button.props.id === 'btnClose') {
                    if (this.dataSource.getState() !== dataSourceConstants.DS_BROWSE) {
                        this.setState({
                            ...this.state,
                            alertIsOpen: true,
                            alertMessage: 'Salve ou cancele os dados antes de sair'
                        });
                        return;
                    }
                }

                if (this.props.onButtonClick) {
                    this.props.onButtonClick(event, button);
                }
                if (button.props.route) {
                    this.props.history.push(button.props.route);
                }
            }

            onSearchButtonClick(field, event) { }

            onToggleExpandedFilter(expanded) {
                this.setState({
                    ...this.state,
                    filterExpanded: expanded
                })

                setTimeout(() => {
                    if (this.state.newHeight !== undefined && this.state.width !== undefined) {
                        if (this.table1) {
                            this.table1.resize(this.state.width-360, this.state.newHeight);
                        }
                        if (this.table2) {
                            this.table2.resize("100%", this.state.newHeight);
                        }
                    }
                }, 500)
            }

            onDoubleClickTable(data) {
                if (WrappedComponent.prototype.hasOwnProperty('onCustomDoubleClick') === true) {
                    this.onCustomDoubleClick(data);
                } else if (loadingProps.routes.edit) {

                    if (WrappedComponent.prototype.hasOwnProperty('onCustomView') === true) {
                        this.onCustomView(button.props.route);
                        return;
                    } else {
                        this.props.history.push(loadingProps.routes.edit);
                    }
                }
            }

            pageConfigHandler(page) {
                if (
                    this.props.query &&
                    this.props.query.rules &&
                    this.props.query.rules.length > 0
                ) {
                    var filter = new AnterosFilterDSL();
                    filter.buildFrom(this.props.query, this.props.sort);
                    if (WrappedComponent.prototype.hasOwnProperty('onFindWithFilter') === true) {
                        return this.onFindWithFilter(filter.toJSON(), page, loadingProps.pageSize,
                            this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy);
                    } else {
                        return loadingProps.endPoints.FIND_WITH_FILTER(
                            loadingProps.resource,
                            filter.toJSON(),
                            page,
                            loadingProps.pageSize,
                            this.getSortFields()
                        );
                    }
                } else if (loadingProps.withFilter && this.filterRef && this.filterRef.current) {
                    if (
                        this.filterRef.current.getQuickFilterText() &&
                        this.filterRef.current.getQuickFilterText() !== ''
                    ) {
                        if (WrappedComponent.prototype.hasOwnProperty('onFindMultipleFields') === true) {
                            return this.onFindMultipleFields(this.props.quickFilterText, fiethis.filterRef.current.getQuickFilterFields(), page, loadingProps.pageSize, this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy);
                        } else {
                            return loadingProps.endPoints.FIND_MULTIPLE_FIELDS(
                                loadingProps.resource,
                                this.props.quickFilterText,
                                this.filterRef.current.getQuickFilterFields(),
                                page,
                                loadingProps.pageSize,
                                this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                            );
                        }
                    } else {
                        return this.refreshData(page);
                    }
                }
            }

            onButtonSearch(event) {
                if (
                    this.props.query &&
                    this.props.query.rules &&
                    this.props.query.rules.length > 0
                ) {
                    var filter = new AnterosFilterDSL();
                    filter.buildFrom(this.props.query, this.props.sort);
                    if (WrappedComponent.prototype.hasOwnProperty('onFindWithFilter') === true) {
                        this.dataSource.open(this.onFindWithFilter(filter.toJSON(), 0, loadingProps.pageSize, this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy));
                    } else {
                        this.dataSource.open(
                            loadingProps.endPoints.FIND_WITH_FILTER(
                                loadingProps.resource,
                                filter.toJSON(),
                                0,
                                loadingProps.pageSize,
                                this.getUser(), loadingProps.fieldsToForceLazy
                            )
                        );
                    }
                } else {
                    this.props.setFilter(
                        this.props.activeFilter,
                        '',
                        this.props.sort,
                        this.props.activeSortIndex,
                        ''
                    );

                    if (WrappedComponent.prototype.hasOwnProperty('onFindAll') === true) {
                        this.dataSource.open(this.onFindAll(0, loadingProps.pageSize,
                            this.getSortFields(),
                            this.getUser(), loadingProps.fieldsToForceLazy));
                    } else {
                        this.dataSource.open(
                            loadingProps.endPoints.FIND_ALL(
                                loadingProps.resource,
                                0,
                                loadingProps.pageSize,
                                this.getSortFields(),
                                this.getUser(), loadingProps.fieldsToForceLazy
                            )
                        );
                    }
                }
            }

            onCloseAlert() {
                this.setState({
                    ...this.state,
                    alertIsOpen: false,
                    alertMessage: ''
                });
            }

            onShowHideLoad(show) {
                this.setState({
                    ...this.state,
                    loading: show,
                    update: Math.random()
                })
            }

            handleOnSelectRecord(row, data, tableId) {
                if (WrappedComponent.prototype.hasOwnProperty('onSelectRecord') === true) {
                    this.onSelectRecord(row, data, tableId)
                }
            }

            handleOnUnselectRecord(row, data, tableId) {
                if (WrappedComponent.prototype.hasOwnProperty('onUnselectRecord') === true) {
                    this.onUnselectRecord(row, data, tableId)
                }
            }

            handleOnSelectAllRecords(records, tableId) {
                if (WrappedComponent.prototype.hasOwnProperty('onSelectAllRecords') === true) {
                    this.onSelectAllRecords(records, tableId)
                }
            }

            handleOnUnselectAllRecords(tableId) {
                if (WrappedComponent.prototype.hasOwnProperty('onUnselectAllRecords') === true) {
                    this.onUnselectAllRecords(tableId)
                }
            }

            onResize(width, height) {
                let newHeight = height - 120;   

                if (this.table1) {
                    this.table1.resize(width-350, newHeight);
                }
                if (this.table2) {
                    this.table2.resize("100%", newHeight);
                }
                this.setState({
                    ...this.state,
                    width: width,
                    newHeight: newHeight
                })
            }


            render() {
                return (
                    <AnterosCard
                        caption={loadingProps.caption}
                        className="versatil-card-full"
                        withScroll={false}
                        styleBlock={{
                            height: 'calc(100% - 120px)'
                        }}
                        ref={ref => (this.card = ref)}
                    >
                        <AnterosResizeDetector
                            handleWidth
                            handleHeight
                            onResize={this.onResize}
                        />
                        <AnterosAlert
                            danger
                            fill
                            isOpen={this.state.alertIsOpen}
                            autoCloseInterval={15000}
                            onClose={this.onCloseAlert}
                        >
                            {this.state.alertMessage}
                        </AnterosAlert>
                        <HeaderActions>
                            <AnterosButton
                                id="btnClose"
                                onButtonClick={this.onButtonClick}
                                route={loadingProps.routes.close}
                                visible={loadingProps.routes.close !== undefined}
                                icon="fa fa-times"
                                small
                                circle
                                secondary
                                disabled={
                                    this.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                                }
                            />
                        </HeaderActions>
                        <AnterosBlockUi
                            tagStyle={{
                                height: this.state.filterExpanded ? '100%' : 'auto'
                            }}
                            styleBlockMessage={{
                                border: '2px solid white',
                                width: '200px',
                                backgroundColor: '#8BC34A',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                            styleOverlay={{
                                opacity: 0.1,
                                backgroundColor: 'black'
                            }}
                            tag="div"
                            blocking={this.state.loading}
                            message={loadingProps.messageLoading}
                            loader={
                                <AnterosLoader active type="ball-pulse" color="#02a17c" />
                            }
                        >
                            {loadingProps.withFilter ? (
                                <div style={{
                                    display: 'flex',
                                    flexFlow: 'row nowrap',
                                    justifyContent: 'space-between',
                                    width: 'calc(100%)',
                                    height: 'calc(100%)'
                                }}>
                                    <div style={{
                                        width: this.state.filterExpanded ? 'calc(100% - 350px)' : 'calc(100%)',
                                    }}>
                                        <UserActions
                                            dataSource={this.dataSource}
                                            onButtonClick={this.onButtonClick}
                                            onButtonSearch={this.onButtonSearch}
                                            routes={loadingProps.routes}
                                            allowRemove={loadingProps.disableRemove ? false : true}
                                            labelButtonAdd={loadingProps.labelButtonAdd}
                                            labelButtonEdit={loadingProps.labelButtonEdit}
                                            labelButtonRemove={loadingProps.labelButtonRemove}
                                            labelButtonSelect={loadingProps.labelButtonSelect}
                                            positionUserActions={this.positionUserActions}
                                            userActions={
                                                this.hasUserActions ? this.getUserActions() : null
                                            }
                                        />
                                        {this.state.filterExpanded ? (
                                            <AnterosDataTable
                                                id={'table' + loadingProps.viewName}
                                                height={'200px'}
                                                ref={ref => (this.table1 = ref)}
                                                dataSource={this.dataSource}
                                                width="100%"
                                                enablePaging={false}
                                                enableSearching={false}
                                                showExportButtons={false}
                                                onDoubleClick={this.onDoubleClickTable}
                                                onSelectRecord={this.handleOnSelectRecord}
                                                onUnSelectRecord={this.handleOnUnselectRecord}
                                                onSelectAllRecords={this.handleOnSelectAllRecords}
                                                onUnSelectAllRecords={this.handleOnUnselectAllRecords}
                                            >
                                                {this.getColumns()}
                                            </AnterosDataTable>
                                        ) : null}
                                    </div>
                                    <AnterosQueryBuilder
                                        zIndex={50}
                                        query={this.props.query}
                                        sort={this.props.sort}
                                        id={loadingProps.filtroDispositivos}
                                        formName={loadingProps.viewName}
                                        ref={this.filterRef}
                                        activeSortIndex={this.props.activeSortIndex}
                                        dataSource={this.dsFilter}
                                        activeFilter={this.props.activeFilter}
                                        onSaveFilter={this.onSaveFilter}
                                        onSelectActiveFilter={this.onSelectActiveFilter}
                                        onQueryChange={this.onQueryChange}
                                        onSortChange={this.onSortChange}
                                        onQuickFilter={this.onQuickFilter}
                                        quickFilterText={this.props.quickFilterText}
                                        quickFilterWidth={
                                            loadingProps.quickFilterWidth
                                                ? loadingProps.quickFilterWidth
                                                : '30%'
                                        }
                                        height="170px"
                                        allowSort={true}
                                        disabled={
                                            this.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                                        }
                                        onSearchButtonClick={this.onSearchButtonClick}
                                        onToggleExpandedFilter={this.onToggleExpandedFilter}
                                    >
                                        {this.getFieldsFilter()}
                                    </AnterosQueryBuilder>
                                </div>
                            ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start'
                                        }}
                                    >
                                        <UserActions
                                            dataSource={this.dataSource}
                                            onButtonClick={this.onButtonClick}
                                            onButtonSearch={this.onButtonSearch}
                                            routes={loadingProps.routes}
                                            allowRemove={loadingProps.disableRemove ? false : true}
                                            labelButtonAdd={loadingProps.labelButtonAdd}
                                            labelButtonEdit={loadingProps.labelButtonEdit}
                                            labelButtonRemove={loadingProps.labelButtonRemove}
                                            labelButtonSelect={loadingProps.labelButtonSelect}
                                            positionUserActions={this.positionUserActions}
                                            userActions={
                                                this.hasUserActions ? this.getUserActions() : null
                                            }
                                        />
                                    </div>
                                )}

                            {!this.state.filterExpanded ? (
                                <AnterosDataTable
                                    id={'table' + loadingProps.viewName}
                                    height={'200px'}
                                    ref={ref => (this.table2 = ref)}
                                    dataSource={this.dataSource}
                                    width="100%"
                                    enablePaging={false}
                                    enableSearching={false}
                                    showExportButtons={false}
                                    onDoubleClick={this.onDoubleClickTable}
                                    onSelectRecord={this.handleOnSelectRecord}
                                    onUnSelectRecord={this.handleOnUnselectRecord}
                                    onSelectAllRecords={this.handleOnSelectAllRecords}
                                    onUnSelectAllRecords={this.handleOnUnselectAllRecords}
                                >
                                    {this.getColumns()}
                                </AnterosDataTable>
                            ) : null}
                            <WrappedComponent
                                {...this.props}
                                ref={ref => (this.wrappedRef = ref)}
                                state={this.state}
                                user={this.props.user}
                                history={this.props.history}
                                dataSource={this.dataSource}
                            />
                        </AnterosBlockUi>
                        <FooterActions className="versatil-card-footer">
                            <AnterosRow>
                                <AnterosCol medium={4}>
                                    <AnterosLabel
                                        caption={`Total ${
                                            loadingProps.caption
                                            } ${this.dataSource.getGrandTotalRecords()}`}
                                    />
                                </AnterosCol>
                                <AnterosCol medium={8}>
                                    <AnterosPagination
                                        horizontalEnd
                                        dataSource={this.dataSource}
                                        visiblePages={3}
                                        onBeforePageChanged={this.onBeforePageChanged}
                                        onPageChanged={this.handlePageChanged}
                                    />
                                </AnterosCol>
                            </AnterosRow>
                        </FooterActions>
                    </AnterosCard >
                );
            }
        }

        return connect(
            mapStateToProps,
            mapDispatchToProps
        )(TableContainerView);
    };
}

class UserActions extends Component {
    render() {
        return (
            <div>
                {this.props.positionUserActions === 'first'
                    ? this.props.userActions
                    : null}
                {this.props.routes.edit ? (
                    <AnterosButton
                        id="btnView"
                        route={this.props.routes.edit}
                        icon="fal fa-eye"
                        small
                        className="versatil-btn-visualizar"
                        caption={
                            this.props.labelButtonEdit ? this.props.labelButtonEdit : 'Visualizar'
                        }
                        hint={
                            this.props.labelButtonEdit ? this.props.labelButtonEdit : 'Visualizar'
                        }
                        onButtonClick={this.props.onButtonClick}
                        disabled={
                            this.props.dataSource.isEmpty() ||
                            this.props.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                        }
                    />
                ) : null}
                {this.props.routes.add ? (
                    <AnterosButton
                        id="btnAdd"
                        route={this.props.routes.add}
                        icon="fal fa-plus"
                        small
                        className="versatil-btn-adicionar"
                        caption={
                            this.props.labelButtonAdd
                                ? this.props.labelButtonAdd
                                : 'Adicionar'
                        }
                        hint={
                            this.props.labelButtonAdd
                                ? this.props.labelButtonAdd
                                : 'Adicionar'
                        }
                        onButtonClick={this.props.onButtonClick}
                        disabled={
                            this.props.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                        }
                    />
                ) : null}
                {this.props.routes.edit ? (
                    <AnterosButton
                        id="btnEdit"
                        route={this.props.routes.edit}
                        icon="fal fa-pencil"
                        small
                        className="versatil-btn-editar"
                        caption={
                            this.props.labelButtonEdit ? this.props.labelButtonEdit : 'Editar'
                        }
                        hint={
                            this.props.labelButtonEdit ? this.props.labelButtonEdit : 'Editar'
                        }
                        onButtonClick={this.props.onButtonClick}
                        disabled={
                            this.props.dataSource.isEmpty() ||
                            this.props.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                        }
                    />
                ) : null}
                {this.props.allowRemove ? (
                    <AnterosButton
                        id="btnRemove"
                        icon="fal fa-trash"
                        disabled={
                            this.props.dataSource.isEmpty() ||
                            this.props.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                        }
                        small
                        caption={
                            this.props.labelButtonRemove
                                ? this.props.labelButtonRemove
                                : 'Remover'
                        }
                        hint={
                            this.props.labelButtonRemove
                                ? this.props.labelButtonRemove
                                : 'Remover'
                        }
                        className="versatil-btn-remover"
                        onButtonClick={this.props.onButtonClick}
                    />
                ) : null}
                <AnterosButton
                    id="btnSelect"
                    icon="fal fa-bolt"
                    disabled={
                        this.props.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                    }
                    small
                    caption={
                        this.props.labelButtonSelect
                            ? this.props.labelButtonSelect
                            : 'Selecionar'
                    }
                    hint={
                        this.props.labelButtonSelect
                            ? this.props.labelButtonSelect
                            : 'Selecionar'
                    }
                    className="versatil-btn-selecionar"
                    onButtonClick={this.props.onButtonSearch}
                />{' '}
                {this.props.positionUserActions === 'last'
                    ? this.props.userActions
                    : null}
            </div>
        );
    }
}

export class TableTemplateActions extends Component {
    render() {
        return <Fragment>{this.props.children}</Fragment>;
    }
}
