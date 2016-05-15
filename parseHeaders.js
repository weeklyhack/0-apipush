import _ from "lodash";
import Handlebars from "handlebars";

// Parse raw header strings into their key-value equivelents
// This converts from 'Foo: bar baz' to {Foo: 'bar baz'}
export default function parseHeaders(rawHeaders, stashApi={}) {
  let headers = rawHeaders.split('\n').map(i => {
    let [name, ...value] = i.split(':');
    let parsedValue = Handlebars.compile(value.join(':').trim())(stashApi);
    return [name, parsedValue];
  });
  return _.fromPairs(headers);
}
