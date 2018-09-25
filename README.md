Tool to generate a Dash-compatible PeopleTools docset

To use:

1. Run `yarn install`
2. Ensure `src/docs.json` is up-to-date
3. Ensure `dashIndexFilePath` in `Info.plist` is up-to-date
3. Run `yarn run generate`

The script will produce `PeopleTools.tgz`.

## Generating `docs.json`

After following the instructions below, clean up the URLs to make them relative
and do not include query strings.

### Functions

Get the `id` of the element with "PeopleCode Built-in Functions and Language
Constructs" in its text from Products > Development Tools > PeopleCode Language 
Reference, then use the browser console to run JavaScript similar to the 
following:

```js
copy(
  Array.prototype.filter
    .call(
      document.querySelectorAll('#ul_d65e26_tpcl a[role="treeitem"]'),
      el => el.textContent !== 'Functions by Category'
    )
    .map(el => el.href)
);
```

Next, get the URLs for the following:
* Meta-SQL Elements > Meta-SQL Reference
* Meta-SQL Elements > Meta-SQL Shortcuts
* System Variables > System Variables Reference
* Meta-HTML > Meta-HTML Reference

### Methods & Properties

Get the `id` of the element with "PeopleCode API Reference" in its text from
Products > Development Tools, then use the browser console to run JavaScript 
similar to the following:

```js
copy(
  Array.prototype.filter
    .call(
      document.querySelectorAll('#ul_lisbj_d3e48 a[role="treeitem"]'),
      el =>
        /(Methods|Properties)$/.test(el.textContent) &&
        el.href.includes('langref_')
    )
    .reduce(
      (acc, el) => {
        if (el.textContent.includes('Methods')) acc.Method.push(el.href);
        if (el.textContent.includes('Properties')) acc.Property.push(el.href);
        return acc;
      },
      { Method: [], Property: [] }
    )
);
```

### Other

Update the index page & copyright page URLs.
