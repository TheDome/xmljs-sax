import Debug from "debug";
import { QualifiedAttribute } from "sax";

export interface XmlAttribute {
  name: string;
  value: string;
  prefix: string;
  local: string;
  uri: string;
}

const debugNode = Debug("xml:node");
const debugResolver = Debug("xml:noderesolver");
const debugChildfinder = Debug("xml:nodechildfinder");
export default class XmlNode {
  /**
   * The name of the node
   */
  public readonly name: string;
  /**
   * Namespaces, which reside in this scope
   */
  private namespace: Record<string, string> = {};
  public readonly URI: string;
  /**
   * Attributes for this node
   */
  public readonly attributes: XmlAttribute[] = [];
  private fullName: string;

  public readonly childs: XmlNode[] = [];
  public value: string | undefined;
  /**
   * A link to the parent node. Null, if this is the root of the tree
   */
  private _parent: XmlNode | null = null;

  constructor(
    name: string,
    qualifiedName: string,
    uri = "",
    namespace?: Record<string, string>
  ) {
    this.name = name;
    this.fullName = qualifiedName;
    this.URI = uri;

    if (namespace) {
      Object.keys(namespace).forEach((v) => {
        this.namespace[v] = namespace[v];
      });
    }
  }

  addChild(node: XmlNode): XmlNode {
    this.childs.push(node);
    node.parent = this;
    return this;
  }

  addAttribute(attr: QualifiedAttribute): XmlNode {
    if (attr.prefix === "xmlns") return this;

    debugNode("Adding attribute: %O", attr);
    this.attributes.push(attr as XmlAttribute);
    return this;
  }

  /**
   * Get the value of a specific attribute
   * @param name The name
   * @param uri When a specific namespace should be found
   */
  getAttribute(name: string, uri?: string): string | null {
    let val;
    if (uri) {
      val = this.attributes.find((a) => a.name === name && a.uri === uri);
    } else {
      val = this.attributes.find((a) => (a.name = name));
    }
    val = val ? val.value : null;
    debugNode("Found attribute value for name: %s -> %s", name, val);
    return val;
  }

  setValue(text: string): XmlNode {
    debugNode("Value of %s is: %s", this.name, text);
    this.value = text;
    return this;
  }

  set parent(parent: XmlNode) {
    this._parent = parent;
    this.namespace = Object.assign(this.namespace, parent.namespace);
  }

  /**
   * Get all childs, where the name and the namespace match
   * @param name The name of the child
   * @param ns The namespace, ehere those childs should be in
   */
  public getChildsWhereName(name: string, ns?: string): XmlNode[] {
    ns = ns ? ns : "";
    debugNode("Finding childs, where name is %s and xmlns is %s", name, ns);
    return this.childs.filter((c) => {
      debugChildfinder("Iterating over child: %s", c.name);
      return c.name === name && c.URI === ns;
    });
  }

  public hasChild(name: string, ns?: string): boolean {
    debugChildfinder("Querying hasChild: %s:%s", name, ns);

    if (ns) {
      return (
        this.childs.find((e) => e.name == name && e.URI == ns) !== undefined
      );
    } else {
      return this.childs.find((e) => e.name == name) !== undefined;
    }
  }

  /**
   * Resolve the path of a child node an return the Node
   *
   * An example would be:
   * <br>
   * <code>
   * resolveNSPath("A:root/B:xml/C:root", {
   *     A: "exampleNS1",
   *     B: "exampleNS2",
   *     C: "exampleNS3",
   * })
   * </code>
   * This function would look for nodes matching those arguments and return the node found under <code>C:root</code>
   * <br>
   *     Furthermore this is a breath first search. So the first child matching the criteria will be given back.
   * @param path The path.
   * @param ns Namespace arguments
   * @param ignoreCase ignore the case of the names
   */
  resolveNSPath(
    path: string,
    ns: Record<string, string>,
    ignoreCase = true
  ): Promise<XmlNode | null> {
    debugResolver(
      "Resolving childs for path: %s. ignoring case: %s, NS attributes are: %O",
      path,
      ignoreCase,
      ns
    );

    return Promise.resolve().then(() => {
      if (path.startsWith("//")) {
        return this.undeterminedResolve(path, ns, ignoreCase);
      }

      return this.determinedResolve(path, ns, ignoreCase);
    });
  }

  private nameMatches(
    expectedLocalName: string,
    expectedNameSpace: string,
    ignoreCase: boolean
  ): boolean {
    const thisNS = this.namespace[this.fullName.split(":")[0]];
    debugResolver(
      "Checking, if the names %s - %s and the ns %s - %s match...",
      expectedLocalName,
      this.name,
      expectedNameSpace,
      thisNS
    );
    const result =
      expectedNameSpace === thisNS &&
      (ignoreCase
        ? this.name.toLocaleLowerCase() ===
          expectedLocalName.toLocaleLowerCase()
        : this.name === expectedLocalName);

    debugResolver("Result is: %s", result);
    return result;
  }

  private undeterminedResolve(
    path: string,
    ns: Record<string, string>,
    ignoreCase: boolean
  ): Promise<XmlNode | null> {
    debugResolver("Path is an undetermined path resolver.");
    return Promise.resolve().then(async () => {
      let child;
      const childSelector = path.substring(2);

      let lookingForMore = false;
      if (childSelector.indexOf("/") !== -1) {
        // We are lookign for childs after this
        child = childSelector.substring(0, childSelector.indexOf("/"));
        lookingForMore = true;
      } else {
        child = childSelector;
      }
      debugResolver("Looking recursively for child %s", child);

      const expectedNameSpace =
        child.indexOf(":") !== -1 ? child.split(":")[0] : "";
      const expectedLocalName =
        child.indexOf(":") !== -1 ? child.split(":")[1] : child;

      debugResolver(
        "Expected loclName: %s actual: %s",
        expectedLocalName,
        this.name
      );
      debugResolver(
        "Expected nameSpace: %s actual: %s",
        ns[expectedNameSpace],
        this.namespace[this.fullName.split(":")[0]]
      );
      if (
        this.nameMatches(expectedLocalName, ns[expectedNameSpace], ignoreCase)
      ) {
        debugResolver("Current name matched undetermined resolver");
        if (lookingForMore) {
          debugResolver("Looking for more childs inside this");
          path = childSelector.substring(childSelector.indexOf("/") + 1);
        } else {
          debugResolver("Returning this!");
          return this;
        }
      }

      for (const c of this.childs) {
        const r = await c.resolveNSPath(path, ns, ignoreCase);
        if (r) {
          return r;
        }
      }

      return null;
    });
  }

  private determinedResolve(
    path: string,
    ns: Record<string, string>,
    ignoreCase: boolean
  ): Promise<XmlNode | null> {
    return Promise.resolve().then(async () => {
      // Strip out current node
      const indexForNext =
        path.indexOf("/") === -1 ? path.length : path.indexOf("/");
      const expectedName = path.substring(0, indexForNext);
      const expectedNameSpace = expectedName.split(":")[0];
      const expectedLocalName = expectedName.split(":")[1];
      const childPath = path.substring(indexForNext + 1);
      const nextChild = childPath.substring(0, childPath.indexOf("/"));

      debugResolver("Expected node name: %s", expectedLocalName);
      debugResolver("Actual node name: %s", this.name);

      if (
        this.nameMatches(expectedLocalName, ns[expectedNameSpace], ignoreCase)
      ) {
        // The names match...
        debugResolver(path);
        if (path.indexOf("/") === -1) {
          debugResolver("We are not looking for childs anymore...");
          return this;
        }
        debugResolver("Names match...");

        debugResolver("Resolving childs: %s", childPath);
        debugResolver("Next child is: %s", nextChild);

        for (const c of this.childs) {
          const r = await c.resolveNSPath(childPath, ns, ignoreCase);
          if (r) {
            return r;
          }
        }
      }

      return null;
    });
  }
}
