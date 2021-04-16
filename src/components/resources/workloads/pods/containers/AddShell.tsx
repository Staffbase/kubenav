import { IonButton, IonIcon, IonItem, IonItemOption, IonLabel, IonList, IonPopover } from '@ionic/react';
import { terminal } from 'ionicons/icons';
import React, { useContext, useState } from 'react';

import { IContext, ITerminalContext, TActivator } from '../../../../../declarations';
import { AppContext } from '../../../../../utils/context';
import { TerminalContext } from '../../../../../utils/terminal';
import { addShell } from '../../../../plugins/terminal/helpers';
import { AddCustomCommand } from './AddCustomCommand';

interface IAddShellProps {
  activator: TActivator;
  namespace: string;
  pod: string;
  container: string;
  closeItemSliding?: () => void;
}

const AddShell: React.FunctionComponent<IAddShellProps> = ({
  activator,
  namespace,
  pod,
  container,
  closeItemSliding,
}: IAddShellProps) => {
  const context = useContext<IContext>(AppContext);
  const terminalContext = useContext<ITerminalContext>(TerminalContext);

  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [popoverEvent, setPopoverEvent] = useState();

  const [showCustomCommand, setShowCustomCommand] = useState<boolean>(false);

  const url = `/api/v1/namespaces/${namespace}/pods/${pod}`;

  return (
    <React.Fragment>
      <IonPopover isOpen={showPopover} event={popoverEvent} onDidDismiss={() => setShowPopover(false)}>
        <IonList>
          <IonItem
            button={true}
            detail={false}
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(false);
              if (closeItemSliding) {
                closeItemSliding();
              }
              addShell(context, terminalContext, url, container, 'bash');
            }}
          >
            <IonLabel>bash</IonLabel>
          </IonItem>
          <IonItem
            button={true}
            detail={false}
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(false);
              if (closeItemSliding) {
                closeItemSliding();
              }
              addShell(context, terminalContext, url, container, 'sh');
            }}
          >
            <IonLabel>sh</IonLabel>
          </IonItem>
          <IonItem
            button={true}
            detail={false}
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(false);
              if (closeItemSliding) {
                closeItemSliding();
              }
              addShell(context, terminalContext, url, container, 'powershell');
            }}
          >
            <IonLabel>powershell</IonLabel>
          </IonItem>
          <IonItem
            button={true}
            detail={false}
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(false);
              if (closeItemSliding) {
                closeItemSliding();
              }
              addShell(context, terminalContext, url, container, 'cmd');
            }}
          >
            <IonLabel>cmd</IonLabel>
          </IonItem>
          <IonItem
            button={true}
            detail={false}
            onClick={(e) => {
              e.stopPropagation();
              setShowPopover(false);
              if (closeItemSliding) {
                closeItemSliding();
              }
              setShowCustomCommand(true);
            }}
          >
            <IonLabel>exec …</IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>

      {showCustomCommand ? (
        <AddCustomCommand
          context={context}
          terminalContext={terminalContext}
          url={url}
          container={container}
          onDidDismiss={() => setShowCustomCommand(false)}
        />
      ) : null}

      {activator === 'item-option' ? (
        <IonItemOption
          color="primary"
          onClick={(e) => {
            e.persist();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPopoverEvent(e as any);
            setShowPopover(true);
          }}
        >
          <IonIcon slot="start" icon={terminal} />
          Term
        </IonItemOption>
      ) : null}

      {activator === 'button' ? (
        <IonButton
          size="small"
          fill="clear"
          slot="end"
          onClick={(e) => {
            e.stopPropagation();
            e.persist();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPopoverEvent(e as any);
            setShowPopover(true);
          }}
        >
          <IonIcon slot="icon-only" icon={terminal} />
        </IonButton>
      ) : null}
    </React.Fragment>
  );
};

export default AddShell;
