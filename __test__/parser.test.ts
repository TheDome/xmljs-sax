/*
 * Copyright (c) 2020.
 *
 * This file is part of xmlsax.
 *
 * xmlsax is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * xmlsax is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Foobar.  If not, see <https://www.gnu.org/licenses>
 */

import parse from "../lib";

describe("XMLParser", function () {
  it("should read a simple XML", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      "\n" +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      '      <m:Price includedVat="1.21">34.5</m:Price>\n' +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";
    await expect(parse(xml)).resolves.toMatchSnapshot();
  });

  it("should read a complicated XML", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      "      <m:Price>34.5</m:Price>\n" +
      "    </m:GetStockPriceResponse>\n" +
      "    <m:GetStockPriceResponse>\n" +
      "        <m:Price>35.5</m:Price>\n" +
      "        <m:priCe>36.5</m:priCe>\n" +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";
    const root = await parse(xml);
    expect(root).toMatchSnapshot();

    expect(root.childs.length).toBe(1);
    expect(root.childs[0].name).toBe("Body");
    expect(root.childs[0].childs.length).toBe(2);
    expect(root.childs[0].childs[1].childs.length).toBe(2);
    expect(root.childs[0].childs[0].childs.length).toBe(1);
  });

  it("should manage self-closing tags", async function () {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<A:propfind xmlns:A="DAV:">\n' +
      "  <A:prop>\n" +
      "    <A:current-user-principal/>\n" +
      "    <A:principal-URL/>\n" +
      "    <A:resourcetype/>\n" +
      "  </A:prop>\n" +
      '\t<A:href xmlns:A="DAV:">2.ics</A:href>\n' +
      "</A:propfind>";

    const root = await parse(xml);
    expect(root.name).toBe("propfind");

    const props = await root.resolveNSPath("A:propfind/A:prop", { A: "DAV:" });

    expect(props?.childs.length).toBe(3);
    expect(props?.childs[0].name).toBe("current-user-principal");
  });
});

describe("Resolver", function () {
  it("should resolve the path to a child", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      "\n" +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      '      <m:Price includedVat="1.21">34.5</m:Price>\n' +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";

    const root = await parse(xml);

    const priceNode = await root.resolveNSPath(
      "A:envelope/A:body/B:getstockPriceResponsE/B:price",
      {
        A: "http://www.w3.org/2001/12/soap-envelope",
        B: "http://www.example.org/stock",
      }
    );

    expect(priceNode).not.toBeNull();
    expect(priceNode?.value).toEqual("34.5");
  });

  it("should find a child using an indefinite child syntax", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      "\n" +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      '      <m:Price includedVat="1.21">34.5</m:Price>\n' +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";

    const root = await parse(xml);

    const priceNode = await root.resolveNSPath("//B:price", {
      A: "http://www.w3.org/2001/12/soap-envelope",
      B: "http://www.example.org/stock",
    });

    expect(priceNode).not.toBeNull();
    expect(priceNode?.value).toEqual("34.5");
  });

  it("should find a child using an indefinite child syntax", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      "\n" +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      '      <m:Price includedVat="1.21">34.5</m:Price>\n' +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";

    const root = await parse(xml);

    const priceNode = await root.resolveNSPath(
      "//B:GetStockPriceResponse/B:Price",
      {
        A: "http://www.w3.org/2001/12/soap-envelope",
        B: "http://www.example.org/stock",
      }
    );

    expect(priceNode).not.toBeNull();
    expect(priceNode?.value).toEqual("34.5");
  });
});

describe("Finding childs", function () {
  it("should find children by a specific filter", async function () {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<B:calendar-multiget xmlns:B="urn:ietf:params:xml:ns:caldav" >\n' +
      '  <A:prop xmlns:A="DAV:">\n' +
      "    <A:getetag/>\n" +
      "    <B:calendar-data/>\n" +
      '    <C:created-by xmlns:C="http://calendarserver.org/ns/"/>\n' +
      '    <C:updated-by xmlns:C="http://calendarserver.org/ns/"/>\n' +
      "    <B:schedule-tag/>\n" +
      "  </A:prop>\n" +
      '\t<A:href xmlns:A="DAV:">2.ics</A:href>\n' +
      '\t<A:href xmlns:A="DAV:">1.ics</A:href>\n' +
      '\t<A:href xmlns:A="DAV:">3.ics</A:href>\n' +
      "</B:calendar-multiget>";

    const root = await parse(xml);

    expect(root.name).toBe("calendar-multiget");
    expect(root.URI).toBe("urn:ietf:params:xml:ns:caldav");
    expect(root.childs.length).toBe(4);

    const href = root.getChildsWhereName("href", "DAV:");

    expect(href.length).toBe(3);
    expect(href[0].value).toBe("2.ics");
  });
});
