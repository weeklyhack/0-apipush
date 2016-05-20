Project 0: `apipush`
===

ApiPush is a simple app that lets anyone easily deploy a public api for a
service that already exists but isn't in api-form.

Here's a simple example. When a user does a `GET /`, we return `Hello`. When the
user adds a query variable `name` (ie, `?name=bob`), we return `Hello bob`.
Notice the handlebars templates - they allow each route to by dynamic and
expressive.
```json
{
  "name": "Hello World API",
  "versions": {
    "v1": {
      "routes": [
        {
          "accept": {
            "method": "GET",
            "url": "/"
          },
          "proxy": {
            "via": "static",
            "body": "Hello {{query.name}}"
          }
        }
      ]
    }
  }
}
```

Another example: Here, we fetch Bluebird's
package.json and return it in the document tree. The `json` helper stringifies
any json structure passed to it, and the triple stashe (`{{{`) ensures that our
json won't be escaped.
```json
{
  "name": "Bluebird package API",
  "versions": {
    "v1": {
      "routes": [
        {
          "accept": {
            "method": "GET",
            "url": "/"
          },
          "proxy": {
            "via": "http",
            "method": "GET",
            "url": "https://raw.githubusercontent.com/petkaantonov/bluebird/master/package.json",
            "responses": {
              "success": {
                "contains": "",
                "then": "{ \"success\": true, \"response\": {{{json proxy.body}}} }"
              }
            }
          }
        }
      ]
    }
  }
}
```

Ok, here's a little more practical example. We'll scrape from Google's home page
the title. The `jquery_text` helper gets the text of the passed css selector.
```json
{
  "name": "The title of Google is....",
  "versions": {
    "v1": {
      "routes": [
        {
          "accept": {
            "method": "GET",
            "url": "/"
          },
          "proxy": {
            "via": "http",
            "method": "GET",
            "url": "http://google.com",
            "responses": {
              "success": {
                "contains": "Google",
                "then": "{\"success\": true, \"title\": \"{{jquery_text 'title'}}\"}"
              },
              "failure": {
                "contains": "",
                "then": "{\"success\": false, \"title\": null}"
              }
            }
          }
        }
      ]
    }
  }
}
```

An example of an actual API
---
This api returns voting data for monroe county, a county in upstate new york. It
scrapes the voting page to get the data and returns it in nicely-formatted
json. Give this a try: `http://apipush.apps.rgaus.net/monroe/api/v1?number=43&street=Roslyn%20St&zip=14619`.
```json
{
  "name": "Monroe County Voting API",
  "versions": {
    "v1": {
      "routes": [
        {
          "accept": {
            "method": "GET",
            "url": "/"
          },
          "proxy": {
            "via": "http",
            "method": "POST",
            "url": "http://www.monroecounty.gov/etc/voter/index.php",
            "headers": "Content-Type: application/x-www-form-urlencoded",
            "body": "v[lname]=&v[dobm]=MM&v[dobd]=DD&v[doby]=YYYY&v[no]={{query.number}}&v[sname]={{query.street}}&v[zip]={{query.zip}}&submit=Get+Voter+Info",
            "responses": {
              "dsabilities_success": {
                "contains": "disabilities",
                "then": "{\"success\": true, \"disabilities\": true, \"polling_place_text\": \"{{jquery_text '#poll'}}\"}"
              },
              "success": {
                "contains": "District Information",
                "then": "{\"success\": true, \"polling_place_text\": \"{{jquery_text '#poll'}}\"}"
              },
              "failure": {
                "contains": "",
                "then": "{\"success\": false}"
              }
            }
          }
        }
      ]
    }
  }
}
```
( More examples are located within `client/examples` )

Upload to the cloud
---
To upload any of the above to the cloud, install the local cli tool. That's it!
```bash
npm install --global apipush
apipush path/to/api.json
```

Each Field Explained
---
*NOTE: Handlebars templates can be used throughout the `proxy` section.*
- `name`: THe human-readable name for the api.
- `desc`: The human-readable description for the api.
- `versions`: An object containing each version name as a key with the required
  attributes.
- `versions[version].routes`: An array of routes that a version contains.
- `versions[version].routes[i].accept`: The inbound path and method that must
  match for the route to run.
- `versions[version].routes[i].proxy`: The handler for the route that is called
  when the route is run.
- `versions[version].routes[i].proxy.via`: The method the proxy should use to
  resolve. Valid types are `static`, `http`, and `websockets`.
- `versions[version].routes[i].proxy.responses`: The possible ways the route
  will respond to the query.
- `versions[version].routes[i].proxy.responses[response].contains`: When the
  response proxyed from the source (either the http request or a websockets
  message) contains this string, return with this response.
- `versions[version].routes[i].proxy.responses[response].then`: THe string to
  respond with when the response is sent.

Advanced
---
- So, you want to pick a custom slug (ie, the api name in the url): specify a "slug" key in the root level of the json.
- List of helpers:
  - `jquery_text`: Given a selector, return the text contained in all of the elements that match the given selector. Think of this like `$('selector').text()`.
  - `jquery_val`: Given a selector, return the value contained in all of the elements that match the given selector. Think of this like `$('selector').val()`.
  - `json`: Given a JSON structure, return its corresponding stringified structure. This should be used with triple stashes (`{{{`) to ensure the json isn't double-escaped.
- A schema for the api is available at <https://github.com/1egoman/0-apipush/blob/master/validator.js> in json schema format. 

-----------------

Apipush is the first app in a string of apps I'm writing as an initiative for me
to write more code. See <medium> for more information.
