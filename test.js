const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords) => {
  let nodes = [...tree]; // Copying the tree to avoid modifying the original parameter
  let tempExpandedNodes = {};
  let selectedRowString = '';

  const checkForExpansion = (node, key) => {
    return node.level === hierArr[key] && node.code === movementData[`movOrg${key}`];
  };

  const fetchChildNodes = async (node) => {
    const children = await fetchHierarchyDownStream(node, locale, setServerErrors, showTerminatedRecords);
    node.children = children;
  };

  const handleExpansion = (node, i, childIndex) => {
    const updatedNodes = node.children;
    tempExpandedNodes[i] = {};
    tempExpandedNodes = tempExpandedNodes[i];
    selectedRowString = selectedRowString ? `${selectedRowString}-${i}` : `${i}`;

    if (childIndex > -1) {
      selectedRowString = `${selectedRowString}-${childIndex}`;
      setExpandedNodes(tempExpandedNodes);
      setSelectedRowIndex(selectedRowString);
      return true;
    }

    return false;
  };

  const findExpansion = async (key) => {
    for (const childNode of nodes) {
      if (checkForExpansion(childNode, key)) {
        if (!childNode.children || childNode.children.length === 0) {
          await fetchChildNodes(childNode);
        }

        const childIndex = childNode.children.findIndex(child => child.code === movementData.movOrgCd && child.level === movementData.level);

        if (handleExpansion(childNode, i, childIndex)) {
          return true;
        }
      }
    }
    return false;
  };

  let foundExpansion = false;

  for (const key of Object.keys(hierArr)) {
    if (movementData[`movOrg${key}`]) {
      let i = 0;

      foundExpansion = await findExpansion(key);
      
      if (foundExpansion) {
        break;
      }
    }
  }

  if (!foundExpansion) {
    setExpandedNodes(tempExpandedNodes);
    setSelectedRowIndex(selectedRowString);
  }
};