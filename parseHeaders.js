import _ from "lodash";

// Parse raw header strings into their key-value equivelents
// This converts from 'Foo: bar baz' to {Foo: 'bar baz'}
export default function parseHeaders(rawHeaders) {
  let headers = rawHeaders.split('\n').map(i => {
    let [name, ...value] = i.split(':');
    return [name, value.join(':').trim()];
  });
  return _.fromPairs(headers);
}
