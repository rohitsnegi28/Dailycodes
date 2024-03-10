const fetchDownstreamAndExpandTree = async ({ tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords, fetchHierarchyDownstreamFn }) => {
    // Initialize variables
    let expandedNodes = {};
    let selectedRowIndex = '';
    let isExpansionAchieved = false;

    // Function to expand the current node
    const expandCurrentNode = async (node) => {
        // If node has no children, fetch its children
        if (!node.children || node.children.length === 0) {
            const children = await fetchHierarchyDownstreamFn(node, locale, setServerErrors, showTerminatedRecords);
            node.children = children;
        }

        // Update selectedRowIndex based on expansion
        if (selectedRowIndex.length > 0) {
            selectedRowIndex = `${selectedRowIndex}-${expansionIndex}`;
        } else {
            selectedRowIndex = `${expansionIndex}`;
        }

        // Check if expansion achieved by finding child node
        const childIndex = node.children.findIndex(child => compareTwoNodes(child.code, movementData.movOrgCd, child.level, movementData[`movOrg${key}`]));
        if (childIndex > -1) {
            isExpansionAchieved = true;
            selectedRowIndex = `${selectedRowIndex}-${childIndex}`;
        }
    };

    // Function to iterate nodes for expansion
    const iterateNodesForExpansion = async (key, expansionIndexParam, currentMovLevelExpandedParam) => {
        let expansionIndex = expansionIndexParam;
        let currentMovLevelExpanded = currentMovLevelExpandedParam;

        // Iterate over nodes of the tree
        for (const node of tree) {
            // Check if the node matches the root level
            if (compareTwoNodes(node.code, movementData.movOrgCd, node.level, movementData.level)) {
                selectedRowIndex = '0';
                isExpansionAchieved = true;
            } else if (compareTwoNodes(node.level, hierArr[key], node.code, movementData[`movOrg${key}`])) {
                // If node matches the current level, expand it
                await expandCurrentNode(node);
            }

            // Check if current level expansion is achieved
            if (currentMovLevelExpanded) {
                break;
            }

            expansionIndex += 1;
        }

        return { expansionIndex, currentMovLevelExpanded };
    };

    // Get keys of hierarchical indices
    const hierIndexs = Object.keys(hierArr);

    // Iterate over hierarchical indices for expansion
    for (const key of hierIndexs) {
        if (movementData[`movOrg${key}`]) {
            let currentMovLevelExpanded = false;
            let expansionIndex = 0;

            // Iterate nodes for expansion at current level
            ({ expansionIndex, currentMovLevelExpanded } = await iterateNodesForExpansion(key, expansionIndex, currentMovLevelExpanded));
        }

        // Break if expansion achieved
        if (isExpansionAchieved) {
            break;
        }
    }

    // Set expanded nodes and selected row index
    setExpandedNodes(expandedNodes);
    setSelectedRowIndex(selectedRowIndex);
};