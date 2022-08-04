import React, { useEffect, useState } from 'react';
import { useAddonState, useChannel, useStorybookApi, isStory } from '@storybook/api';
import { AddonPanel, Source } from '@storybook/components';
import { ADDON_ID, EVENTS } from './constants';
import { PanelContent } from './PanelContent';

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
  const storydata = getCurrentStoryData();
  const [data, setData] = useState('testing');
  console.log(storydata);
  useEffect(() => {
    if (props.active && isStory(storydata)) {
      console.log('fetching...');
      fetch(`/getFile/${storydata.parameters.fileName}`).then((res) => {
        res.text().then((text) => {
          setData(text);
        });
      });
    }
  }, [props.active, storydata]);

  return (
    <AddonPanel {...props}>
      <Source code={data} language="tsx" />
    </AddonPanel>
  );
};
