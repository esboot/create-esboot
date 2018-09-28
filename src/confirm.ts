import {confirm} from './vendor/prompts/prompts';

export default (msg, skip = false) =>
    (skip) ? Promise.resolve() : confirm({message: msg, initial: true}).then(p => {
        return p ? Promise.resolve() : Promise.reject();
    });
