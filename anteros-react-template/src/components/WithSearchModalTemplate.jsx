import React from 'react';
import { connect } from 'react-redux';

import { AnterosRemoteDatasource, dataSourceEvents, DATASOURCE_EVENTS, dataSourceConstants } from '@anterostecnologia/anteros-react-datasource';
import { AnterosQueryBuilder, AnterosQueryBuilderData, AnterosFilterDSL } from '@anterostecnologia/anteros-react-querybuilder';
import { autoBind, processErrorMessage, AnterosError } from '@anterostecnologia/anteros-react-core';
import { AnterosModal, ModalActions } from '@anterostecnologia/anteros-react-containers';
import { AnterosRow, AnterosCol } from '@anterostecnologia/anteros-react-layout';
import { AnterosPagination } from '@anterostecnologia/anteros-react-navigation';
import { AnterosAlert } from '@anterostecnologia/anteros-react-notification';
import { AnterosDataTable } from '@anterostecnologia/anteros-react-table';
import { AnterosButton } from '@anterostecnologia/anteros-react-buttons';
import { AnterosTags } from '@anterostecnologia/anteros-react-label';

const defaultValues = {
    openDataSourceFilter: true,
    openMainDataSource: true,
    messageLoading: 'Carregando, por favor aguarde...',
    withFilter: true,
    fieldsToForceLazy: '',
    modalSize: 'semifull',
    defaultSortFields: '',
    labelField: 'id',
    cumulativeSelection: false,
    version: 'v1'
};

export default function WithSearchModalTemplate(_loadingProps) {
    let loadingProps = { ...defaultValues, ..._loadingProps };

    const mapStateToProps = state => {
        let query, sort, activeSortIndex, activeFilter, user, quickFilterText;
        let reducer = state[loadingProps.reducerName];
        if (reducer) {
            query = reducer.query;
            sort = reducer.sort;
            activeSortIndex = reducer.activeSortIndex;
            activeFilter = reducer.activeFilter;
            quickFilterText = reducer.quickFilterText;
        }
        user = state[loadingProps.userReducerName].user;
        return {
            query: query,
            sort: sort,
            activeSortIndex: activeSortIndex,
            activeFilter: activeFilter,
            user: user,
            quickFilterText: quickFilterText
        };
    };

    const mapDispatchToProps = dispatch => {
        return {
            setDatasource: dataSource => {
                dispatch(loadingProps.actions.setDatasource(dataSource));
            },
            setFilter: (activeFilter, query, sort, activeSortIndex, quickFilterText) => {
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
        class SearchModal extends WrappedComponent {
            constructor(props, context) {
                super(props);
                autoBind(this);
                this.filterRef = React.createRef();

                if (!loadingProps.endPoints) {
                    throw new AnterosError(
                        'Informe o objeto com os endPoints de consulta. '
                    );
                }
                if (!loadingProps.resource) {
                    throw new AnterosError('Informe o nome do RESOURCE de consulta. ');
                }
                if (!loadingProps.reducerName) {
                    throw new AnterosError('Informe o nome do REDUCER. ');
                }
                if (!loadingProps.viewName) {
                    throw new AnterosError('Informe o nome da View. ');
                }
                if (!loadingProps.caption) {
                    throw new AnterosError('Informe o caption(titulo) da View. ');
                }
                if (loadingProps.withFilter === true && !loadingProps.filterName) {
                    throw new AnterosError('Informe o nome do filtro. ');
                }

                if (WrappedComponent.prototype.hasOwnProperty('getColumns') === false) {
                    throw new AnterosError('Implemente o método getColumns na classe.');
                }

                if (
                    loadingProps.withFilter &&
                    WrappedComponent.prototype.hasOwnProperty('getFieldsFilter') === false
                ) {
                    throw new AnterosError(
                        'Implemente o método getFieldsFilter na classe.'
                    );
                }

                if (WrappedComponent.prototype.hasOwnProperty('getRoutes') && this.getRoutes()) {
                    loadingProps.routes = this.getRoutes();
                }

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
                    if (this.dataSource instanceof AnterosRemoteDatasource){
                        this.dataSource.setAjaxPageConfigHandler(this.pageConfigHandler);
                    }
                    this.dataSource.addEventListener(
                        DATASOURCE_EVENTS,
                        this.onDatasourceEvent
                    );
                } else {
                    this.createMainDataSource();
                }

                this.state = {
                    dataSource: [],
                    alertIsOpen: false,
                    alertMessage: '',
                    modalOpen: '',
                    filterExpanded: undefined,
                    modalCallback: null
                };

                autoBind(this);
            }
            createDataSourceFilter() {
                this.dsFilter = new AnterosRemoteDatasource();
                AnterosQueryBuilderData.configureDatasource(this.dsFilter, loadingProps.version);
            }

            getUser() {
                if (this.props.user) {
                    return this.props.user;
                }
                return undefined;
            }

            createMainDataSource() {
                if (this.props.dataSource) {
                    this.dataSource = this.props.dataSource;
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

                if (this.dataSource instanceof AnterosRemoteDatasource){
                    this.dataSource.setAjaxPageConfigHandler(this.pageConfigHandler);
                }
                this.dataSource.addEventListener(
                    DATASOURCE_EVENTS,
                    this.onDatasourceEvent
                );
            }

            pageConfigHandler(page) {
                if (
                    this.props.query &&
                    this.props.query.rules &&
                    this.props.query.rules.length > 0
                ) {
                    var filter = new AnterosFilterDSL();
                    filter.buildFrom(this.props.query, this.props.sort);
                    return loadingProps.endPoints.FIND_WITH_FILTER(
                        loadingProps.resource,
                        filter.toJSON(),
                        page,
                        loadingProps.pageSize,
                        this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                    );
                } else {
                    if (
                        this.filterRef.current.getQuickFilterText() &&
                        this.filterRef.current.getQuickFilterText() !== ''
                    ) {
                        return loadingProps.endPoints.FIND_MULTIPLE_FIELDS(
                            loadingProps.resource,
                            this.props.quickFilterText,
                            this.filterRef.current.getQuickFilterFields(),
                            page,
                            loadingProps.pageSize,
                            this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                        );
                    } else {
                        return loadingProps.endPoints.FIND_ALL(
                            loadingProps.resource,
                            page,
                            loadingProps.pageSize,
                            this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                        );
                    }
                }
            }

            componentDidMount() {
                this.openData();
                if (WrappedComponent.prototype.hasOwnProperty('onDidMount') === true) {
                    this.onDidMount();
                }
            }

            openData() {
                if (loadingProps.defaultSort) {
                    if (loadingProps.openDataSourceFilter) {
                        if (!this.dsFilter.isOpen()) {
                            this.dsFilter.open(
                                AnterosQueryBuilderData.getFilters(
                                    loadingProps.viewName,
                                    loadingProps.filterName,
                                    loadingProps.version
                                )
                            );
                        }
                    }
                    if (loadingProps.openMainDataSource) {
                        if (!this.dataSource.isOpen()) {
                            if (WrappedComponent.prototype.hasOwnProperty('onFindAll') === true) {
                                this.dataSource.open(this.onFindAll(0, loadingProps.pageSize, loadingProps.defaultSort, this.getUser(), loadingProps.fieldsToForceLazy));
                            } else {
                                this.dataSource.open(
                                    loadingProps.endPoints.FIND_ALL(
                                        loadingProps.resource,
                                        0,
                                        loadingProps.pageSize,
                                        loadingProps.defaultSort, this.getUser(), loadingProps.fieldsToForceLazy
                                    )
                                );
                            }
                            this.handlePageChanged(0);
                        }
                        if (this.dataSource.getState() !== dataSourceConstants.DS_BROWSE) {
                            this.dataSource.cancel();
                        }
                    }
                }
            }

            componentWillUnmount() {
                if (this.dataSource) {
                    this.dataSource.removeEventListener(
                        DATASOURCE_EVENTS,
                        this.onDatasourceEvent
                    );
                    if (this.dataSource instanceof AnterosRemoteDatasource){
                        this.dataSource.setAjaxPageConfigHandler(null);
                    }
                }
                if (WrappedComponent.prototype.hasOwnProperty('onWillUnmount') === true) {
                    this.onWillUnmount();
                }
            }

            componentDidUpdate() {
                this.openData();
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

            handlePageChanged(newPage) {
                this.setState({
                    ...this.state,
                    currentPage: newPage
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
                if (this.filterRef.current.getQuickFilterSort() && this.filterRef.current.getQuickFilterSort() !== '') {
                    return this.filterRef.current.getQuickFilterSort();
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

                if (
                    event === dataSourceEvents.AFTER_OPEN ||
                    event === dataSourceEvents.AFTER_GOTO_PAGE ||
                    event === dataSourceEvents.ON_ERROR
                ) {
                    this.props.setDatasource(this.dataSource);
                    loading = false;
                }

                if (event === dataSourceEvents.AFTER_INSERT) {
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

            onSelectRecord(row, data, tableId) {
                this.props.selectedRecords.push(this.dataSource.getCurrentRecord());
                if (loadingProps.cumulativeSelection)
                this.setState({...this.state, update: Math.random()});
            }

            onUnSelectRecord(row, data, tableId) {
                for (var i = 0; i < this.props.selectedRecords.length; i++) {
                    if (
                        this.props.selectedRecords[i] === this.dataSource.getCurrentRecord()
                    ) {
                        this.props.selectedRecords.splice(i, 1);
                    }
                }
                if (loadingProps.cumulativeSelection)
                this.setState({...this.state, update: Math.random()});
            }

            handleDelete(i) {
                this.props.selectedRecords.splice(i, 1);
                this.setState({...this.state, update:Math.random()});
            }

            onClear(){
                this.props.selectedRecords.splice(0, this.props.selectedRecords.length);
                this.setState({...this.state, update:Math.random()});
            }

            onSelectAllRecords(records, tableId) {
                let _this = this;
                this.props.selectedRecords.splice(0, this.props.selectedRecords.length);
                records.forEach(function buscaObjetos(element) {
                    _this.props.selectedRecords.push(element);
                });
                if (loadingProps.cumulativeSelection)
                this.setState({...this.state, update: Math.random()});
            }

            onUnSelectAllRecords(tableId) {
                this.props.selectedRecords.splice(0, this.props.selectedRecords.length);
                if (loadingProps.cumulativeSelection)
                this.setState({...this.state, update: Math.random()});
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
                                this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                            )
                        );
                    }
                } else {
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
                                this.getSortFields(), this.getUser(), loadingProps.fieldsToForceLazy
                            )
                        );
                    }
                }
            }

            autoCloseAlert() {
                this.setState({
                    ...this.state,
                    alertIsOpen: false,
                    alertMessage: ''
                });
            }

            onClick(event) {
                if (event.target.getAttribute('data-user') === 'btnOK') {
                    if (this.dataSource.isEmpty()) {
                        this.setState({
                            ...this.state,
                            alertIsOpen: true,
                            alertMessage: 'Selecione um registro para continuar.'
                        });
                    } else {
                        if (this.props.selectedRecords.length === 0) {
                            this.props.selectedRecords.push(
                                this.dataSource.getCurrentRecord()
                            );
                        }
                        this.props.onClickOk(event, this.props.selectedRecords);
                    }
                } else if (event.target.getAttribute('data-user') === 'btnCancel') {
                    if (this.props.onClickCancel) {
                        this.props.onClickCancel(event);
                    }
                }
            }

            onCloseButton() {
                if (this.props.onClickCancel) {
                    this.props.onClickCancel();
                }
            }

            onToggleExpandedFilter(expanded) {
                this.setState({
                    ...this.state,
                    filterExpanded: expanded
                })
            }

            render() {
                let modalOpen = this.props.modalOpen;
                if (modalOpen && modalOpen.includes('#')) {
                    modalOpen = modalOpen.split('#')[0];
                }
                let modalSize = {};
                if (loadingProps.modalSize === "extrasmall") {
                    modalSize = { extraSmall: true }
                } else if (loadingProps.modalSize === "small") {
                    modalSize = { small: true }
                } else if (loadingProps.modalSize === "medium") {
                    modalSize = { medium: true }
                } else if (loadingProps.modalSize === "large") {
                    modalSize = { large: true }
                } else if (loadingProps.modalSize === "semifull") {
                    modalSize = { semifull: true }
                } else if (loadingProps.modalSize === "full") {
                    modalSize = { full: true }
                }
                return (
                    <AnterosModal
                        id={loadingProps.viewName}
                        title={loadingProps.caption}
                        primary
                        {...modalSize}
                        showHeaderColor={true}
                        showContextIcon={false}
                        isOpen={modalOpen === loadingProps.viewName}
                        onCloseButton={this.onCloseButton}
                        withScroll={false}
                        hideExternalScroll={true}
                    >
                        <AnterosAlert
                            danger
                            fill
                            isOpen={this.state.alertIsOpen}
                            autoCloseInterval={15000}
                        >
                            {this.state.alertMessage}
                        </AnterosAlert>
                        <ModalActions>
                            {this.positionUserActions === 'first'
                                ? this.hasUserActions
                                    ? this.getUserActions()
                                    : null
                                : null}
                            <AnterosButton success dataUser="btnOK" onClick={this.onClick}>
                                OK
                            </AnterosButton>{' '}
                            <AnterosButton danger dataUser="btnCancel" onClick={this.onClick}>
                                Fechar
                            </AnterosButton>
                            {this.positionUserActions === 'last'
                                ? this.hasUserActions
                                    ? this.getUserActions()
                                    : null
                                : null}
                        </ModalActions>

                        <div>
                            {loadingProps.withFilter ? (
                                <div style={{
                                    display: 'flex',
                                    flexFlow: 'row nowrap',
                                    justifyContent: 'space-between',
                                    paddingBottom: '15px',
                                    width: 'calc(100%)',
                                    height: this.state.filterExpanded ? '500px' : 'calc(100%)'
                                }}>
                                    <div style={{
                                        width: this.state.filterExpanded ? 'calc(100% - 350px)' : 'calc(100%)',
                                    }}>
                                        <div>
                                            <AnterosButton
                                                id="btnSelecionar"
                                                icon="fa fa-sync"
                                                disabled={
                                                    this.dataSource.getState() !== dataSourceConstants.DS_BROWSE
                                                }
                                                secondary
                                                onButtonClick={this.onButtonSearch}
                                            >
                                                Atualizar
                                            </AnterosButton>
                                            {loadingProps.cumulativeSelection?<AnterosTags addTags={false} tags={this.props.selectedRecords} labelField={loadingProps.labelField}
                                                handleDelete={this.handleDelete} onClear={this.onClear} />:null}
                                        </div>
                                        {this.state.filterExpanded ? (
                                            <AnterosDataTable
                                                id={'tb' + loadingProps.viewName}
                                                height="296px"
                                                dataSource={this.dataSource}
                                                width="100%"
                                                enablePaging={false}
                                                enableSearching={false}
                                                showExportButtons={false}
                                                onSelectRecord={this.onSelectRecord}
                                                onUnSelectRecord={this.onUnSelectRecord}
                                                onSelectAllRecords={this.onSelectAllRecords}
                                                onUnSelectAllRecords={this.onUnSelectAllRecords}
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
                            ) : null}

                            {this.state.filterExpanded ? null : (
                                <AnterosDataTable
                                    id={'tb' + loadingProps.viewName}
                                    height="350px"
                                    dataSource={this.dataSource}
                                    width="100%"
                                    enablePaging={false}
                                    enableSearching={false}
                                    showExportButtons={false}
                                    onSelectRecord={this.onSelectRecord}
                                    onUnSelectRecord={this.onUnSelectRecord}
                                    onSelectAllRecords={this.onSelectAllRecords}
                                    onUnSelectAllRecords={this.onUnSelectAllRecords}
                                >
                                    {this.getColumns()}
                                </AnterosDataTable>
                            )}
                            <AnterosRow>
                                <AnterosCol medium={12}>
                                    <AnterosPagination
                                        horizontalEnd
                                        dataSource={this.dataSource}
                                        visiblePages={3}
                                        onPageChanged={this.handlePageChanged}
                                    />
                                </AnterosCol>
                            </AnterosRow>
                            <WrappedComponent {...this.props} dataSource={this.dataSource} />
                        </div>
                    </AnterosModal >
                );
            }
        }

        return connect(
            mapStateToProps,
            mapDispatchToProps
        )(SearchModal);
    };
}
