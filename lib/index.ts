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

import { parser as saxParser, QualifiedAttribute } from "sax";
import Debug from "debug";
import XmlNode from "./XmlNode";

/**
 * Parse an xml string.
 * @param xml An xml string to parse
 * @param strict Enable strict mode
 */
export default function parse(xml: string, strict = true): Promise<XmlNode> {
  const debug = Debug("xml:parser");

  return new Promise<XmlNode>((resolve, reject) => {
    const parser = saxParser(strict, { xmlns: true });
    let root: XmlNode;
    let current: XmlNode;
    const stack: XmlNode[] = [];

    parser.onopentag = (tag) => {
      debug('Tag opened "%s": %O', tag.name, tag);

      const node = new XmlNode(
        "local" in tag ? tag.local : tag.name,
        tag.name,
        "ns" in tag ? tag.ns : undefined
      );

      for (const key in tag.attributes) {
        debug("Iterating over attr: %O", key);
        let attr = tag.attributes[key];
        if (typeof attr !== "string") {
          // is a qualified attribute
          attr = attr as QualifiedAttribute;

          node.addAttribute(attr);
        } else {
          debug("Could not parse attr: %s", attr);
        }
      }

      if (!root) {
        root = node;
      } else {
        current.addChild(node);
      }
      // Store the current node
      current = node;
      stack.push(node);
    };

    parser.onclosetag = () => {
      // Node is finished
      const tag = stack.pop();
      if (tag) {
        debug("Tag %s closed", tag.name);
      } else {
        debug("Tag closed: undefined");
      }
    };

    parser.onattribute = (attr) => {
      debug("Attribute found: %s=%s", attr.name, attr.value);
      if ("local" in attr) {
      } else {
        debug("Could not parse attr: %O", attr);
      }
    };

    parser.onend = () => {
      debug("Parser finished parsing!");
      resolve(root);
    };

    parser.ontext = (t) => {
      debug("Received text: %s", t);
      if (current && t && t.trim().length !== 0) {
        current.setValue(t);
      }
    };

    parser.onerror = (e) => {
      debug("Parser encountered error: %O", e);
      reject(e);
    };

    parser.write(xml).end();
  });
}
