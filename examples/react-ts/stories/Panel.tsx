import React, { useEffect, useState } from 'react';
import { useStorybookApi, isStory } from '@storybook/api';
import { AddonPanel } from '@storybook/components';
import Editor from '@monaco-editor/react';

interface PanelProps {
  active: boolean;
}

export const Panel: React.FC<PanelProps> = (props) => {
  //storybook.js.org/docs/react/addons/addons-api#useaddonstate
  // const [results, setState] = useAddonState(ADDON_ID, {
  //   danger: [],
  //   warning: [],
  // });

  //storybook.js.org/docs/react/addons/addons-api#usechannel
  // const emit = useChannel({
  //   [EVENTS.RESULT]: (newResults) => setState(newResults),
  // });
  const { getCurrentStoryData } = useStorybookApi();
  const storyData = getCurrentStoryData();
  const [data, setData] = useState<{ content: string; path: string }>();
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  useEffect(() => {
    if (props.active && isStory(storyData)) {
      console.log('fetching...');
      fetch(`/getFile/${storyData.parameters.fileName}`).then((res) => {
        res.json().then((json: { content: string; path: string }) => {
          setData(json);
        });
      });
    }
  }, [props.active, storyData]);

  const onSave = () => {
    const url = `/saveFile`;
    fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(data),
    });
    setUnsavedChanges(false);
  };

  const onChange: React.ComponentPropsWithoutRef<typeof Editor>['onChange'] = (value) => {
    setData((data) => ({ ...data, content: value }));
    setUnsavedChanges(true);
  };

  return (
    <AddonPanel {...props}>
      <button onClick={onSave} disabled={!unsavedChanges}>
        save
      </button>
      <Editor defaultLanguage="javascript" value={data?.content ?? ''} onChange={onChange} />
    </AddonPanel>
  );
};
