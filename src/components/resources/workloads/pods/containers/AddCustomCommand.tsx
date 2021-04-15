import { IonButton, IonPopover, IonTextarea } from '@ionic/react';
import React, { useState } from 'react';
import { IContext, ITerminalContext } from '../../../../../declarations';
import { addShell } from '../../../../plugins/terminal/helpers';

interface IAddCustomCommandProps {
  context: IContext;
  terminalContext: ITerminalContext;
  url: string;
  container: string;
  onDidDismiss: () => void;
}

export const AddCustomCommand: React.FunctionComponent<IAddCustomCommandProps> = ({
  context,
  terminalContext,
  url,
  container,
  onDidDismiss,
}: IAddCustomCommandProps) => {
  const [showPopover, setShowPopover] = useState<boolean>(true);
  let command = '';

  return (
    <React.Fragment>
      <IonPopover
        isOpen={showPopover}
        onDidDismiss={() => {
          setShowPopover(false);
          onDidDismiss();
        }}
      >
        <IonTextarea
          cols={160}
          rows={12}
          onIonChange={(event) => {
            command = event.detail.value ?? '';
          }}
        />
        <IonButton
          onClick={(e) => {
            e.stopPropagation();
            setShowPopover(false);
            addShell(context, terminalContext, url, container, command);
          }}
        >
          Execute
        </IonButton>
      </IonPopover>
    </React.Fragment>
  );
};
