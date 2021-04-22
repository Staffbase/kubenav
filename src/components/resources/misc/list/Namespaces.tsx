import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonSearchbar,
  IonSpinner,
  useIonRouter,
} from '@ionic/react';
import { V1Namespace, V1NamespaceList } from '@kubernetes/client-node';
import { checkmark, options } from 'ionicons/icons';
import React, { useContext, useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import { IContext } from '../../../../declarations';
import { kubernetesRequest } from '../../../../utils/api';
import { AppContext } from '../../../../utils/context';

interface INamespaceProps {
  baseUrl: string;
}

const Namespaces: React.FunctionComponent<INamespaceProps> = (props: INamespaceProps) => {
  const context = useContext<IContext>(AppContext);
  const cluster = context.currentCluster();
  const router = useIonRouter();

  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [popoverEvent, setPopoverEvent] = useState();

  const { isError, isLoading, error, data, refetch } = useQuery<V1NamespaceList, Error>(
    ['Namespaces', cluster ? cluster.id : ''],
    async () =>
      await kubernetesRequest(
        'GET',
        '/api/v1/namespaces',
        '',
        context.settings,
        await context.kubernetesAuthWrapper(''),
      ),
    context.settings.queryConfig,
  );

  const setNamespace = (ns: V1Namespace) => {
    router.push(`/${props.baseUrl}/${ns.metadata?.name || ''}`);
  };

  const setAllNamespaces = () => {
    router.push(`/${props.baseUrl}`);
  };

  useEffect(() => {
    if (showPopover) {
      refetch();
    }
  }, [showPopover, refetch]);

  const [filterText, setFilterText] = useState('');
  const filterRegex = new RegExp(filterText, 'gi');

  const renderItems = (items: V1Namespace[]) => {
    const showFilterbar = filterText || items.length > 5;
    return (
      <IonContent>
        {showFilterbar && (
          <IonSearchbar placeholder="Filter" onIonChange={(event) => setFilterText(event.detail.value ?? '')} />
        )}
        <IonList>
          <IonItem button={true} detail={false} onClick={() => setAllNamespaces()}>
            {cluster && cluster.namespace === '' ? <IonIcon slot="end" color="primary" icon={checkmark} /> : null}
            <IonLabel>All Namespaces</IonLabel>
          </IonItem>

          {items
            .filter((item) => {
              return item.metadata?.name?.match(filterRegex);
            })
            .map((namespace, index) => {
              return (
                <IonItem key={index} button={true} detail={false} onClick={() => setNamespace(namespace)}>
                  {namespace.metadata && cluster && cluster.namespace === namespace.metadata.name ? (
                    <IonIcon slot="end" color="primary" icon={checkmark} />
                  ) : null}
                  <IonLabel>{namespace.metadata ? namespace.metadata.name : ''}</IonLabel>
                </IonItem>
              );
            })}
        </IonList>
      </IonContent>
    );
  };

  const renderError = () => (
    <IonList>
      <IonItem>{error ? error.message : 'Could not get Namespaces'}</IonItem>
    </IonList>
  );

  const renderLoading = () => (
    <IonItem>
      <IonLabel>Loading ...</IonLabel>
      <IonSpinner />
    </IonItem>
  );

  return (
    <React.Fragment>
      <IonPopover isOpen={showPopover} event={popoverEvent} onDidDismiss={() => setShowPopover(false)}>
        {isError ? renderError() : data ? renderItems(data.items) : isLoading ? renderLoading() : null}
      </IonPopover>

      <IonButton
        onClick={(e) => {
          e.persist();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPopoverEvent(e as any);
          setShowPopover(true);
        }}
      >
        <IonIcon slot="icon-only" icon={options} />
      </IonButton>
    </React.Fragment>
  );
};

export default Namespaces;
