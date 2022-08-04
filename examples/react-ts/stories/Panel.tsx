import React, { useEffect, useState } from 'react';
import { useStorybookApi, isStory } from '@storybook/api';
import { AddonPanel, IconButton, Icons, Button } from '@storybook/components';
import Editor from '@monaco-editor/react';

interface PanelProps {
  active: boolean;
}

export const Panel: React.FC<PanelProps> = (props) => {
  const { getCurrentStoryData } = useStorybookApi();
  const storyData = getCurrentStoryData();
  const [data, setData] = useState<{ content: string; path: string }>({ content: '', path: '' });
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
      <Button
        small={false}
        containsIcon={true}
        onClick={onSave}
        disabled={!unsavedChanges}
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          zIndex: 1,
          background: 'bisque',
          boxShadow: '0 0 10px #00000066',
        }}
      >
        <Icons icon="pullrequest" name="save" />
      </Button>
      <Editor defaultLanguage="javascript" value={data?.content} onChange={onChange} />
    </AddonPanel>
  );
};
