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
      "\n" +
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
    await expect(parse(xml)).resolves.toMatchSnapshot();
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
