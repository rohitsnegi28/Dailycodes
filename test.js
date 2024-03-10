const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords) => {
    let nodes = tree;
    let tempExpandedNodes1 = {};
    let selectedRowString = '';
    let isExpansionAchieved = false;

    const processNode = async (node, index) => {
        if (!node.children || node.children.length === 0) {
            const children = await fetchHierarchyDownStream(node, locale, setServerErrors, showTerminatedRecords);
            node.children = children;
        }
        
        nodes = node.children;
        tempExpandedNodes1[index] = {};
        tempExpandedNodes1 = tempExpandedNodes1[index];
        
        selectedRowString = selectedRowString ? `${selectedRowString}-${index}` : `${index}`;

        const childIndex = node.children.findIndex((child) => child.code === movementData.movOrgCd && child.level === movementData.level);
        if (childIndex > -1) {
            isExpansionAchieved = true;
            selectedRowString = `${selectedRowString}-${childIndex}`;
        }
    };

    for (const key of Object.keys(hierArr)) {
        if (movementData[`movOrg${key}`]) {
            let flag = true;
            let i = 0;
            
            for (const node of nodes) {
                if (node.code === movementData.movOrgCd && node.level === movementData.level) {
                    selectedRowString = '0';
                    isExpansionAchieved = true;
                    break;
                }
                
                if (node.level === hierArr[key] && node.code === movementData[`movOrg${key}`]) {
                    await processNode(node, i);
                    flag = false;
                    break;
                }
                
                if (!flag) {
                    break;
                }
            }
            i += 1;
        }

        if (isExpansionAchieved) {
            break;
        }
    }
    
    setExpandedNodes({});
    setSelectedRowIndex(selectedRowString);
};