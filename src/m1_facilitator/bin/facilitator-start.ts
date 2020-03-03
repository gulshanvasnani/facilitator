// Copyright 2020 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import commander from 'commander';

import Facilitator from '../../common/Facilitator';
import Logger from '../../common/Logger';

import Container from '../Container';
import Manifest from '../manifest/Manifest';

let facilitator: Facilitator;

commander
  .option('-m, --manifest <manifest>', 'Path to manifest file.')
  .action(
    async (
      options: {
        manifest: string;
      }): Promise<void> => {
      try {
        const manifest = Manifest.fromFile(options.manifest);
        facilitator = await Container.create(manifest);
        await facilitator.start();
      } catch (e) {
        Logger.error(`Error in facilitator start command. Reason: ${e.message}`);
      }
    },
  );
