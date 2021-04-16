import { RefresherEventDetail } from '@ionic/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonProgressBar,
  IonRefresher,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { memo, useContext, useState } from 'react';
import { useInfiniteQuery } from 'react-query';
import { RouteComponentProps } from 'react-router';

import { IContext } from '../../declarations';
import { kubernetesRequest } from '../../utils/api';
import { AppContext } from '../../utils/context';
import { getProperty, isNamespaced } from '../../utils/helpers';
import { resources } from '../../utils/resources';
import LoadingErrorCard from '../misc/LoadingErrorCard';
import Details from './misc/list/Details';
import Namespaces from './misc/list/Namespaces';
import ItemOptions from './misc/details/ItemOptions';

interface IMatchParams {
  section: string;
  type: string;
  namespace?: string;
}

type IListPageProps = RouteComponentProps<IMatchParams>;

// ListPage shows a list of the selected resource. The list can be filtered by namespace and each item contains a status
// indicator, to get an overview of problems in the cluster.
const ListPage: React.FunctionComponent<IListPageProps> = ({ match }: IListPageProps) => {
  const context = useContext<IContext>(AppContext);
  const cluster = context.currentCluster();

  if (cluster) {
    if (match.params.namespace !== undefined) {
      cluster.namespace = match.params.namespace;
    } else {
      cluster.namespace = '';
    }
  }

  // Determine one which page we are currently (which items for a resource do we want to show) by the section and type
  // parameter. Get the component 'ResourceItem' we want to render.
  const page = resources[match.params.section].pages[match.params.type];
  const Component = page.listItemComponent;

  // namespace and showNamespace is used to group all items by namespace and to only show the namespace once via the
  // IonItemDivider component.
  let namespace = '';
  let showNamespace = false;

  // searchText is used to search and filter the list of items.
  const [searchText, setSearchText] = useState<string>('');

  const fetchItems = async (cursor) =>
    await kubernetesRequest(
      'GET',
      `${page.listURL(cluster ? cluster.namespace : '')}?limit=50${
        cursor.pageParam ? `&continue=${cursor.pageParam}` : ''
      }`,
      '',
      context.settings,
      await context.kubernetesAuthWrapper(''),
    );

  const {
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    data,
    error,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(
    // NOTE: Array keys (https://react-query.tanstack.com/docs/guides/queries#array-keys) do not work with
    // useInfiniteQuery, therefore we are creating a string only query key with the values, which normaly are used as
    // query key.
    // ['ListPage', cluster ? cluster.id : '', cluster ? cluster.namespace : '', match.params.section, match.params.type],
    `ListPage_${cluster ? cluster.id : ''}_${cluster ? cluster.namespace : ''}_${match.params.section}_${
      match.params.type
    }`,
    fetchItems,
    {
      ...context.settings.queryConfig,
      refetchInterval: context.settings.queryRefetchInterval,
      getNextPageParam: (lastGroup) =>
        lastGroup.metadata && lastGroup.metadata.continue ? lastGroup.metadata.continue : false,
    },
  );

  // The doRefresh method is used for a manual reload of the items for the corresponding resource. The
  // event.detail.complete() call is required to finish the animation of the IonRefresher component.
  const doRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    event.detail.complete();
    refetch();
  };

  // allGroups is used to fetch additional items from the Kubernetes API. When the fetchNextPage funtion is finished we
  // have to call the complete() method on the infinite scroll instance.
  const loadMore = async (event: CustomEvent<void>) => {
    await fetchNextPage();
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>{page.pluralText}</IonTitle>
          <IonButtons slot="primary">
            {isNamespaced(match.params.type) ? (
              <Namespaces baseUrl={`resources/${match.params.section}/${match.params.type}`} />
            ) : null}
            <Details
              refresh={refetch}
              bookmark={{
                title: page.pluralText,
                url: match.url,
                namespace: isNamespaced(match.params.type) ? (cluster ? cluster.namespace : '') : '',
              }}
              type={match.params.type}
              page={page}
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isFetching ? <IonProgressBar slot="fixed" type="indeterminate" color="primary" /> : null}
        <IonRefresher slot="fixed" onIonRefresh={doRefresh} />

        {!isError && cluster ? (
          <React.Fragment>
            <IonSearchbar
              inputmode="search"
              value={searchText}
              onIonChange={(e) => setSearchText(e.detail.value ? e.detail.value : '')}
            />

            <IonList>
              {data && data.pages
                ? data.pages.map((group, i) => (
                    <React.Fragment key={i}>
                      {group && group.items
                        ? group.items
                            .filter((item) => {
                              if (searchText.startsWith('$')) {
                                const parts = searchText.split(':');
                                if (
                                  parts.length !== 2 ||
                                  (parts.length === 2 && parts[1] === '') ||
                                  getProperty(item, parts[0].substring(2)) === undefined
                                ) {
                                  return false;
                                }

                                const regex = new RegExp(parts[1].trim(), 'gi');
                                return getProperty(item, parts[0].substring(2).trim()).toString().match(regex);
                              } else {
                                const regex = new RegExp(searchText, 'gi');
                                if (match.params.type === 'events') {
                                  return (
                                    item.metadata &&
                                    item.metadata.name &&
                                    (item.metadata.name.match(regex) ||
                                      item.message.match(regex) ||
                                      item.reason.match(regex))
                                  );
                                } else {
                                  return item.metadata && item.metadata.name && item.metadata.name.match(regex);
                                }
                              }
                            })
                            .map((item, j) => {
                              if (
                                isNamespaced(match.params.type) &&
                                item.metadata &&
                                item.metadata.namespace &&
                                item.metadata.namespace !== namespace
                              ) {
                                namespace = item.metadata.namespace;
                                showNamespace = true;
                              } else {
                                showNamespace = false;
                              }

                              return (
                                <IonItemGroup key={j}>
                                  {showNamespace ? (
                                    <IonItemDivider>
                                      <IonLabel>{namespace}</IonLabel>
                                    </IonItemDivider>
                                  ) : null}
                                  <ItemOptions
                                    item={item}
                                    url={page.detailsURL(
                                      item.metadata ? item.metadata.namespace : '',
                                      item.metadata ? item.metadata.name : '',
                                    )}
                                  >
                                    <Component item={item} section={match.params.section} type={match.params.type} />
                                  </ItemOptions>
                                </IonItemGroup>
                              );
                            })
                        : null}
                    </React.Fragment>
                  ))
                : null}
              <IonInfiniteScroll
                threshold="25%"
                disabled={!hasNextPage || (isFetchingNextPage as boolean)}
                onIonInfinite={loadMore}
              >
                {(!isFetchingNextPage as boolean) ? (
                  <IonButton size="small" expand="block" fill="clear" onClick={() => fetchNextPage()}>
                    Load more
                  </IonButton>
                ) : null}
                <IonInfiniteScrollContent loadingText={`Loading more ${page.pluralText}...`}></IonInfiniteScrollContent>
              </IonInfiniteScroll>
            </IonList>
          </React.Fragment>
        ) : isFetching ? null : (
          <LoadingErrorCard
            cluster={context.cluster}
            clusters={context.clusters}
            error={error as Error}
            icon={page.icon}
            text={`Could not get ${page.pluralText}`}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default memo(ListPage, (prevProps, nextProps): boolean => {
  if (prevProps.match.url !== nextProps.match.url) {
    return false;
  }

  return true;
});
