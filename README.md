# PeopleTools for Dash

Tool to generate a [Dash][1]-compatible PeopleTools docset
from Oracle's [PeopleTools Online Help][2].

## Generating `src/docs.json`

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
    .map(el => el.href.replace(/.*\/(cd\/.*)\?.*$/, '$1'))
);
```

Next, get the URLs for the following:

- Meta-SQL Elements > Meta-SQL Reference
- Meta-SQL Elements > Meta-SQL Shortcuts
- System Variables > System Variables Reference
- Meta-HTML > Meta-HTML Reference

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
        const href = el.href.replace(/.*\/(cd\/.*)\?.*$/, '$1');
        if (el.textContent.includes('Methods')) acc.Method.push(href);
        if (el.textContent.includes('Properties')) acc.Property.push(href);
        return acc;
      },
      { Method: [], Property: [] }
    )
);
```

### Other

Update the index page & copyright page URLs.

## Generating `PeopleTools.docset`

**NOTE:** If running on Windows, use Windows Subsystem for Linux (WSL). If you
do not, the `tgz` file will have permission issues when opening on a \*nix
system.

To use:

1. Run `yarn install`
2. Ensure `src/docs.json` is up-to-date
3. Ensure `dashIndexFilePath` in `Info.plist` is up-to-date
4. Run `yarn run generate`

The script will produce `PeopleTools.tgz`.

Next, follow [Dash's][3]
instructions for contributing the docset.

[1]: https://kapeli.com/dash
[2]: https://docs.oracle.com/cd/E17566_01/epm91pbr0/eng/psbooks/psft_homepage.htm
[3]: https://github.com/Kapeli/Dash-User-Contributions
