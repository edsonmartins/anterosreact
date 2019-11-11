import React, { Component } from 'react';
import { AnterosModal, ModalActions } from 'anteros-react-containers';
import { AnterosAlert } from 'anteros-react-notification';
import { AnterosButton } from 'anteros-react-buttons';
import {
    AnterosRemoteDatasource,
    dataSourceEvents,
    dataSourceConstants, DATASOURCE_EVENTS
} from 'anteros-react-datasource';
import { autoBind } from 'anteros-react-core';
import { processErrorMessage, processDetailErrorMessage } from 'anteros-react-core';

const defaultValues = {
    withDatasource: false,
    openMainDataSource: false,
    pageSize: 30,
    requireSelectRecord: false
};

export default function WithFormModalTemplate(_loadingProps) {
    let loadingProps = { ...defaultValues, ..._loadingProps };


    return WrappedComponent => {
        class Modal extends WrappedComponent {
            constructor(props) {
                super(props);
                autoBind(this);

                if (!loadingProps.endPoints) {
                    throw new AnterosError(
                        'Informe o objeto com os endPoints de consulta. '
                    );
                }
                if (!loadingProps.viewName) {
                    throw new AnterosError('Informe o nome da View. ');
                }
                if (!loadingProps.caption) {
                    throw new AnterosError('Informe o caption(titulo) da View. ');
                }

                if (loadingProps.withDatasource) {
                    if (!loadingProps.resource) {
                        throw new AnterosError('Informe o nome do RESOURCE de consulta. ');
                    }
                    this.createMainDataSource();
                }

                this.state = {
                    alertIsOpen: false,
                    alertMessage: '',
                    detailMessage: undefined,
                    modalOpen: '',
                    modalCallback: null,
                    selectedRecords: []
                };
            }
            createMainDataSource() {
                if (this.props.dataSource) {
                    this.dataSource = this.props.dataSource;
                } else {
                    this.dataSource = new AnterosRemoteDatasource();
                    this.dataSource.setAjaxPostConfigHandler(entity => {
                        return loadingProps.endPoints.POST(loadingProps.resource, entity);
                    });
                    this.dataSource.setValidatePostResponse(response => {
                        return response.data !== undefined;
                    });
                    this.dataSource.setAjaxDeleteConfigHandler(entity => {
                        return loadingProps.endPoints.DELETE(loadingProps.resource, entity);
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
                if (loadingProps.withDatasource && loadingProps.openMainDataSource) {
                    if (!this.dataSource.isOpen()) {
                        this.dataSource.open(
                            loadingProps.endPoints.FIND_ALL(
                                loadingProps.resource,
                                0,
                                loadingProps.pageSize
                            )
                        );
                    }
                    if (this.dataSource.getState() !== dataSourceConstants.DS_BROWSE) {
                        this.dataSource.cancel();
                    }
                }
            }

            componentWillUnmount() {
                if (this.dataSource) {
                    this.dataSource.removeEventListener(
                        DATASOURCE_EVENTS,
                        this.onDatasourceEvent
                    );
                    this.dataSource.setAjaxPageConfigHandler(null);
                }
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
                        var result = processErrorMessage(error);
                        var debugMessage = processDetailErrorMessage(error);
                        this.setState({
                            ...this.state,
                            alertIsOpen: true,
                            loading: false,
                            debugMessage: (debugMessage===""?undefined:debugMessage),
                            alertMessage: result
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

            autoCloseAlert() {
                this.setState({
                    ...this.state,
                    alertIsOpen: false,
                    alertMessage: ''
                });
            }

            onClick(event, button) {
                if (button.props.id === "btnOK") {
                    this.props.dataSource.post();
                    this.props.onClickOk(event, this.props.selectedRecords);
                } else if (button.props.id == "btnCancel") {
                    this.props.dataSource.cancel();
                    this.props.onClickCancel(event);
                }
            }

            if (this.state.debugMessage){
                AnterosSweetAlert({
                  title: 'Detalhes do erro',
                  html: '<b>'+this.state.debugMessage+'</b>'
                });
              }    

            render() {
                return (
                    <AnterosModal
                        id={'modal' + loadingProps.viewName}
                        title={loadingProps.caption}
                        primary
                        large
                        showHeaderColor={true}
                        showContextIcon={false}
                        isOpen={this.props.modalOpen === loadingProps.viewName}
                        onClose={this.onClose}
                    >
                        <AnterosAlert
                            danger
                            fill
                            isOpen={this.state.alertIsOpen}
                            autoCloseInterval={15000}
                        >
                            <div>
                                <AnterosButton id="dtnDetail" circle small icon="far fa-align-justify" onButtonClick={this.onDetailClick}/>
                                {this.state.alertMessage}
                            </div>
                        </AnterosAlert>
                        <ModalActions>
                            <AnterosButton success id="btnOK" onClick={this.onClick}>
                                OK
              </AnterosButton>{' '}
                            <AnterosButton danger id="btnCancel" onClick={this.onClick}>
                                Cancela
              </AnterosButton>
                        </ModalActions>

                        <div>
                            <WrappedComponent dataSource={this.dataSource} {...this.props} />
                        </div>
                    </AnterosModal>
                );
            }
        }

        return Modal;
    };
}
