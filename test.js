const fetchDownStreamAndExpandTree = async (tree, movementData, locale, setServerErrors, setExpandedNodes, setSelectedRowIndex, showTerminatedRecords) => {
    let nodes = tree;
    const keys = Object.keys(hierArr);
    let tempExpandedNodes1 = {};
    const tempExpandedNodes2 = tempExpandedNodes1;
    let selectedRowString = '';
    let isExpansionAchieved = false;
    
    for (const key of keys) {
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
                    if (!node.children || node.children?.length === 0) {
                        const children = await fetchHierarchyDownStream(node, locale, setServerErrors, showTerminatedRecords);
                        node.children = children;
                    }
                    
                    nodes = node.children;
                    tempExpandedNodes1[i] = {};
                    tempExpandedNodes1 = tempExpandedNodes1[i];
                    flag = false;
                    
                    if (selectedRowString.length > 0) {
                        selectedRowString = `${selectedRowString}-${i}`;
                    } else {
                        selectedRowString = `${i}`;
                    }
                    
                    const childIndex = node.children.findIndex((child) => child.code === movementData.movOrgCd && child.level === movementData.level);
                    if (childIndex > -1) {
                        isExpansionAchieved = true;
                        selectedRowString = `${selectedRowString}-${childIndex}`;
                        break;
                    }
                }
                
                if (!flag) {
                    break;
                }
            }
        }
        i += 1;
        if (isExpansionAchieved) {
            break;
        }
    }
    
    setExpandedNodes(tempExpandedNodes2);
    setSelectedRowIndex(selectedRowString);
};