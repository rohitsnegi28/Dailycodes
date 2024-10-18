\
import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  useFilters,
  usePagination,
  useSortBy,
  useTable,
  useBlockLayout,
  useResizeColumns,
  useColumnOrder,
  useRowSelect,
  useAsyncDebounce,
} from 'react-table';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { uniqueId } from '@customuilibrary/mux';
import TextFilter from './filters/TextFilter';
import IndeterminateCheckbox from './filters/IndeterminateCheckbox';
import { Wrapper, Table, NoData } from '../styledComponents';
import sortable from '../assets/images/default.svg';
import descend from '../assets/images/descend.svg';
import ascend from '../assets/images/ascend.png';
import './CustomGrid.scss';
import './CustomGridStyle.scss';
import { staticCommonLabelKeys } from '../../../../moduleConstants';
import { staticLabelKeys } from '../../../../../modules/agency/moduleConstants';

const STR_TRUE = 'true';
const sharedWithStr = 'sharedWith';
const textStr = 'text';
const PRIVATE = 'PRIVATE';
const notificationTime = 1000;
const highlightRow = '.highlightedRow';
const HEADER = 'Header';
const FILTER = 'Filter';
const IS_RESIZING = 'isResizing';
const RESIZER = 'resizer';
const RESIZER_CELL = 'resizerCell';
const milion = 1000000;
const fiveHundred = 500;
const hundread = 100;
const SEVENTEEN = 17;

/**
    *
    * @param {string} val - 'true' or, 'false'
    * @returns - boolean true or false respectively.
    */
const toBool = (val) => val === STR_TRUE || JSON.parse(val) === true;

export const convertToCompatible = (type, value) => {
  let values = [];
  if (value && !Array.isArray(value)) {
    values.push(value);
  } else {
    values = value;
  }
  switch (type) {
    case 'date':
      return values.map((i) => i && `${i}`); // format the date
    case 'boolean':
      return values.map((i) => i === 'true');
    case 'number':
    case 'text':
    default:
      return values.map((i) => i);
  }
};

/**
    * rendering icon on sorting columns
    */
export const getSortStatus = (sortOrder) => {
  switch (sortOrder) {
    case 1:
      return <img alt="ascend" src={ascend} className="sortIcons" />;
    case -1:
      return <img alt="descend" src={descend} className="sortIcons" />;
    default:
      return <img alt="sortable" src={sortable} className="sortIcons" />;
  }
};

/**
    * rendering icon on sorting columns
    */
export const getSortStatusText = (sortOrder) => {
  switch (sortOrder) {
    case 1:
      return 'ascending';
    case -1:
      return 'descending';
    default:
      return 'none';
  }
};

/** To change drag handle color while dragging */
const handleResize = (isResizing, baseClass) => `${baseClass} ${isResizing ? IS_RESIZING : ''}`;

/**
      *
      * @param {event object} e - event object
      */
const handleOnMouseEnter = (e) => {
  const targetClass = e.target.className.split(' ').pop();
  const addStyles = Array.from(document.querySelectorAll(`.${targetClass}`));
  const cells = addStyles.filter((addStyle) => addStyle.className.indexOf('col-head') === -1);

  cells.forEach((cell) => cell.classList.add('isResizing'));
};

/** remove previously added class from all */
const handleOnMouseLeave = () => {
  const removeStyles = Array.from(document.querySelectorAll('.isResizing'));

  removeStyles.forEach((cell) => cell.classList.remove('isResizing'));
};

const rowHighlight = (el) => {
  const trElem = el.closest('tr');
  const isHigh = trElem.classList.contains('highlightedRow');
  if (isHigh) {
    trElem.classList.remove('highlightedRow');
  } else {
    trElem.classList.add('highlightedRow');
  }
};

const handleRowClick = (e, hasRowSelect, rowData, rowNum, onGridRowClick, tbodyId) => {
  let el = null;
  if (e.target.tagName.toLowerCase() === 'td' || e.target.tagName.toLowerCase() === 'path'
  || e.target.tagName.toLowerCase() === 'svg') {
    el = e.target.closest('td');
  } else {
    el = !toBool(hasRowSelect) && e.target;
  }
  if (el) {
    const highlightedRowSelector = `#${tbodyId} ${highlightRow}`;
    const tGridClassCount = document.getElementsByClassName('taGrid');
    if (tGridClassCount.length > 1) {
      const parentClass = document.querySelectorAll(`#${tbodyId}`)[0].closest('.taGrid').parentNode.className;
      const trElems = document.querySelectorAll(`.${parentClass} tr`);
      trElems.forEach((row) => row.classList.remove('highlightedRow'));
      rowHighlight(el);
    } else {
      const highlightedRows = document.querySelectorAll(highlightedRowSelector);
      highlightedRows.forEach((row) => row.classList.remove('highlightedRow'));
      if (el !== null) {
        rowHighlight(el);
      }
    }
  }
  onGridRowClick(rowNum, rowData.original);
};

/**
    * outside click handler
    */
const useOutsideAlerter = (ref, tbodyId) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        const highlightedRowSelector = `#${tbodyId} ${highlightRow}`;
        const highlightedRows = document.querySelectorAll(highlightedRowSelector);
        highlightedRows.forEach((row) => row.classList.remove('highlightedRow'));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);
};

const showMsgCheck = (lookup, t) => {
  if (lookup !== null) {
    return t(staticCommonLabelKeys.COMMON_MSG_NO_DATA_AVAILABLE);
  }
  return t(staticCommonLabelKeys.FILTER_MESSGAE_SEARCH_TO_VIEW);
};
const showMsgNoDataAvailable = (columns, isPeriodDefinition, t, customNoDataMsg, lookup, isCompCheckbox) => {
  const checkNoDataAvailableTd = (isCompCheckbox ? columns.length + 1 : columns.length);
  if (isPeriodDefinition === 'N') {
    return (
      <tbody>
        <tr>
          <td colSpan={checkNoDataAvailableTd} className="withNoRow">
            <NoData>
              {t(staticCommonLabelKeys.PD_VIEW_ERROR)}
            </NoData>
          </td>
        </tr>
      </tbody>
    );
  }
  if (isPeriodDefinition === 'C') {
    return (
      <tbody>
        <tr>
          <td colSpan={checkNoDataAvailableTd} className="withNoRow">
            <NoData>
              {t(staticCommonLabelKeys.PD_VIEW_ERROR_CURRENT)}
            </NoData>
          </td>
        </tr>
      </tbody>
    );
  }
  return (
    <tbody>
      <tr>
        <td colSpan={checkNoDataAvailableTd} className="withNoRow">
          {customNoDataMsg ? (<NoData>{t(customNoDataMsg)}</NoData>)
            : (
              <NoData>
                {showMsgCheck(lookup, t)}
              </NoData>
            )}
        </td>
      </tr>
    </tbody>
  );
};

const showMsgSearchToView = ({ columns, t, isManualAdj, isCompCheckbox }) => {
  const checkMsgSearchToViewTd = (isCompCheckbox ? columns.length + 1 : columns.length);
  return (
    <tbody>
      <tr>
        <td colSpan={checkMsgSearchToViewTd} className="withNoRow">
          {!isManualAdj && <NoData>{t(staticCommonLabelKeys.FILTER_MESSGAE_SEARCH_TO_VIEW)}</NoData>}
          {isManualAdj && <NoData>{t(staticLabelKeys.MCR_GRID_NO_DATA)}</NoData>}
        </td>
      </tr>
    </tbody>
  );
};

const showSelectRow = (columns, t) => (
  <tbody>
    <tr>
      <td colSpan={columns.length} className="withNoRow">
        <NoData>{t('need to select record on 1st grid')}</NoData>
      </td>
    </tr>
  </tbody>
);

const getHighlightedRow = () => {
  const highlightedRow = document.querySelector(highlightRow);
  if (highlightedRow && document.getElementsByClassName('taGrid').length === 1) {
    highlightedRow.classList.remove('highlightedRow');
  }
};

/**
    *  Complete the documentation and put the description of all
    *  the props which has been used over here
    * @param {*}
    */
const changeFilterHandlerFunc = ({ onFilterChange, filtersVal, columns, privateObj }) => {
  onFilterChange(filtersVal.map((f) => {
    const colConfig = columns.find((c) => c.id === f.id);
    const colType = colConfig.dataField !== sharedWithStr ? colConfig.columnType : textStr;
    if (f.value === PRIVATE) {
      return privateObj;
    }
    return {
      key: f.id,
      operator: colConfig.filterOperation,
      type: colType,
      values: convertToCompatible(colConfig.columnType, f.value),
    };
  }));
};
const resizerClass = (index, column, hasRowSelect) => {
  if (toBool(hasRowSelect) && index === 0) {
    return (`col-head col-${index}`);
  }
  return `${handleResize(column.isResizing, RESIZER)} col-head col-${index}`;
};
const getheaderWidth = (length, column, hasCheckbox, isGroupByOrDistinct, hasActionCol) => {
  if (length >= 1) {
    const isCheckbox = (column.id === 'selection' && column.isCheckbox);
    const lengthVal = (hasCheckbox || isGroupByOrDistinct || hasActionCol) ? length - 1 : length;
    const percentage = Math.floor(hundread / lengthVal);
    if (percentage >= SEVENTEEN) {
      return isCheckbox ? '50px' : `${percentage}%`;
    }
  }
  return 'auto';
};
const tableHeader = ({ headerProps, column, isFilterable, isColumnResizable, index, hasRowSelect, hasCheckbox, length, isGroupByOrDistinct, hasActionCol }) => (
  <th
    scope="col"
    data-testid="TableHeadComponent"
    key={headerProps.key}
    role={headerProps.role}
    className={column.id === 'action' ? 'actions-col' : undefined}
    style={{
      width: getheaderWidth(length, column, hasCheckbox, isGroupByOrDistinct, hasActionCol),
      position: headerProps.style.position,
      minWidth: headerProps.style.width,
    }}
    aria-sort={getSortStatusText(column.sortAscending)}
  >
    <span className="columnHeaderText">
      {column.Header && column.render(HEADER)}
      {column.headerUnbold && (
      <span className="headerUnbold">
        {` ${column.headerUnbold}`}
      </span>
      )}
    </span>
    {!column.disableSortBy && (
    <span aria-hidden="true">
      {getSortStatus(column.sortAscending)}
    </span>
    )}
    {toBool(isFilterable) && column.canFilter && (
    <div>{column.render(FILTER)}</div>
    )}
    {toBool(isColumnResizable) && (
    <div
      {...column.getResizerProps()}
      aria-hidden="true"
      onMouseEnter={(e) => handleOnMouseEnter(e)}
      onMouseLeave={() => handleOnMouseLeave()}
          // className={`${handleResize(column.isResizing, RESIZER)} col-head col-${index}`}
      className={resizerClass(index, column, hasRowSelect)}
    />
    )}
  </th>
);

const tableRowClass = (row, isSelected) => {
  if (row.original.isDefault && row.isSelected) {
    return 'defaultRow selectedRow';
  }
  if (row.original.isDefault) {
    return 'defaultRow';
  }
  if (row.isSelected || isSelected) {
    return 'selectedRow';
  }
  return null;
};
const tableRow = ({ rowNum, row, rowProps, hasRowSelect, tbodyId, onGridRowClick, isSelected, canClick, caption }) => {
  const rowClass = tableRowClass(row, isSelected);
  return canClick ? (
    <tr
      id={`${caption}-${rowNum}`}
      className={rowClass}
      data-testid="TableRowComponent"
      key={rowProps.key}
      role={rowProps.role}
      style={{ width: rowProps.style.width }}
      onClick={(e) => handleRowClick(e, hasRowSelect, row, rowNum, onGridRowClick, tbodyId)}
    >
      {row.cells.map((cell, index) => {
        const { key, role } = cell.getCellProps();
        return (
          <td
            className={`${handleResize(cell.column.isResizing, RESIZER_CELL)} col-${index} row-${rowNum}
           ${cell.column.gridClmClass ? cell.column.gridClmClass : ''}`}
            key={key}
            role={role}
            style={{
              width: 'auto',
            }}
          >
            <span className="p-column-title">{cell.column.Header}</span>
            <div>{cell.render('Cell')}</div>
          </td>
        );
      })}
    </tr>
  )
    : (
      <tr
        id={`${caption}-${rowNum}`}
        className={rowClass}
        data-testid="TableRowComponent"
        key={rowProps.key}
        role={rowProps.role}
        style={{ width: rowProps.style.width }}
      >
        {row.cells.map((cell, index) => {
          const { key, role, style: { width } } = cell.getCellProps();
          return (
            <td
              className={`${handleResize(cell.column.isResizing, RESIZER_CELL)} col-${index} row-${rowNum}
           ${cell.column.gridClmClass ? cell.column.gridClmClass : ''}`}
              key={key}
              role={role}
              style={{ width }}
            >
              <span className="p-column-title">{cell.column.Header}</span>
              <div>{cell.render('Cell')}</div>
            </td>
          );
        })}
      </tr>
    );
};
const generateHeader = (props, hideChekAll, checkboxAriaLabel) => {
  const { toggleRowSelected, rows, selectedFlatRows: selRows } = props;
  const activeRow = rows.filter(({ original }) => !original.isDefaultCheck);
  const disabled = activeRow.length === 0;
  let checked = false;
  if (activeRow.length > 0) {
    checked = activeRow.length - selRows.length === 0;
  }
  const indeterminate = !checked && selRows.length > 0;
  const overiddenOnChange = (event) => {
    rows.forEach((row) => {
      if (!row.original.isDefaultCheck) {
        return toggleRowSelected(row.id, event.currentTarget.checked);
      }
      return false;
    });
  };
  const modifiedToggleAllRowsProps = {
    onChange: overiddenOnChange,
    checked,
    disabled,
    indeterminate,
  };
  return (
    <div>
      <IndeterminateCheckbox {...modifiedToggleAllRowsProps} checkboxAriaLabel={checkboxAriaLabel} />
    </div>
  );
};

const showMessageOnNoData = ({ activateDataGrid, columns, isPeriodDefinition, t,
  isManualAdj, customNoDataMsg, lookup, isCompCheckbox }) => {
  if (activateDataGrid) {
    return showMsgNoDataAvailable(columns, isPeriodDefinition, t, customNoDataMsg, lookup, isCompCheckbox);
  }
  return showMsgSearchToView({ columns, t, isManualAdj, isCompCheckbox });
};

const groupByGrid = (activateDataGrid, isGroupBy, isDistinct) => {
  if (activateDataGrid && (isGroupBy || isDistinct)) {
    return 'taGrid groupByGrid';
  }
  return 'taGrid';
};

const initiateClass = (hasRowSelect, isGroupBy, activateDataGrid, isDistinct) => (toBool(hasRowSelect) && !isGroupBy
  ? 'taGrid checkBoxGrid' : groupByGrid(activateDataGrid, isGroupBy, isDistinct));
const eight = 8;
const styleJs = { position: 'sticky', top: -1, zIndex: 1, backgroundColor: 'white', marginTop: '60px' };
const styleTable = { display: 'block', height: '400px', overflowY: 'auto', marginleft: '-100px' };

const tableXYOverflowFunc = ({ columns, setFlag, data, t }) => {
  const checkActions = columns?.find((idx) => (idx.Header === t(staticCommonLabelKeys.COMMON_LABEL_ACTIONS)));
  if (checkActions || data?.length < eight) {
    setFlag(true);
  } else {
    setFlag(false);
  }
};
const renderHeader = ({ flag, headerGroups, isFilterable, isColumnResizable, hasRowSelect, hasCheckbox, isGroupByOrDistinct, hasActionCol }) => (
  <thead style={!flag ? styleJs : {}}>
    {headerGroups.map((headerGroup) => {
      const headerGroupProps = headerGroup.getHeaderGroupProps();
      const headergroupLength = headerGroup.headers.length;
      return (
        <tr
          key={headerGroupProps.key}
          role={headerGroupProps.role}
          style={{ width: headerGroupProps.style.width }}
        >
          {headerGroup.headers.map((column, index) => {
            const headerProps = column.getHeaderProps();
            return tableHeader({ headerProps, column, isFilterable, isColumnResizable, index, hasRowSelect, flag, length: headergroupLength, hasCheckbox, isGroupByOrDistinct, hasActionCol });
          })}
        </tr>
      );
    })}
  </thead>
);
const CustomGrid = ({ data, columns, onFilterChange, onSortByChange, isFilterable, onColumnResizeChange, isSortable,
  isColumnResizable, isSortIconClickable, hasRowSelect, allowClientSideInteractions, columnOrder, activateDataGrid,
  isPeriodDefinition, caption, getSelectedRows, isGroupBy, selectedRowIndex, onGridRowClick, isDependentGrid, lookup,
  hideChekAll, isManualAdj, displayAll, canClick, isDistinct, selectAll, intSelRows, checkboxAriaLabel, customNoDataMsg, isCompCheckbox }) => {
  const IconComponent = useCallback(({ row }) => (
    <div>
      <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} checkboxAriaLabel={checkboxAriaLabel} row={row} />
    </div>
  ));
  const pageSize = displayAll ? milion : fiveHundred;
  const [t] = useTranslation();
  // TBD for preselected Row - const [selRowIds, setSelRowIds] = useState({});
  const defaultColumn = useMemo(() => ({ Filter: TextFilter, minWidth: 30, width: 160, maxWidth: 400 }), []);
  const wrapperRef = useRef(null);
  const [flag, setFlag] = useState(false);
  const tbodyId = `tableBody-${uniqueId()}`;
  const privateObj = { key: 'private', operator: 'None', type: 'text', values: ['PRIVATE'] };
  const hasCheckbox = (toBool(hasRowSelect) && !isGroupBy);
  // TBD for preselected Row - useEffect(() => setSelRowIds(setSelRowIds), [intSelRows]);
  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow, selectedFlatRows, setColumnOrder, state: { sortBy, filters, columnResizing },
  } = useTable(
    { columns,
      data,
      defaultColumn,
      manualFilters: true,
      manualSortBy: !allowClientSideInteractions,
      manualPagination: !allowClientSideInteractions,
      autoResetSelectedRows: true,
      initialState: { pageIndex: 0, pageSize, selectedRowIds: intSelRows || {} },
    },
    useColumnOrder, useFilters, useSortBy, usePagination, useBlockLayout, useResizeColumns, useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((cols) => {
        if (hasCheckbox) {
          return [{ id: 'selection',
            disableSortBy: true,
            disableFilters: true,
            width: 50,
            Header: (props) => (generateHeader(props, hideChekAll, checkboxAriaLabel)),
            Cell: IconComponent,
            isCheckbox: true,
          }, ...cols];
        }
        return [...cols];
      });
    },
  );
  useEffect(() => getHighlightedRow(), [data]);
  useEffect(() => getSelectedRows(selectedFlatRows), [selectedFlatRows]);
  useEffect(() => setColumnOrder(columnOrder), [columnOrder]);
  const onFilterChangeHandler = useAsyncDebounce((filtersVal) => {
    changeFilterHandlerFunc({ onFilterChange, filtersVal, columns, privateObj });
  }, notificationTime);
  useEffect(() => onFilterChangeHandler(filters), [filters]);
  useEffect(() => onSortByChange(sortBy), [sortBy]);
  useEffect(() => onColumnResizeChange(columnResizing), [columnResizing]);
  useOutsideAlerter(wrapperRef, tbodyId);
  useEffect(() => tableXYOverflowFunc({ columns, setFlag, data, t }), [columns[0]?.actions?.length, data?.length]);
  const isGroupByOrDistinct = activateDataGrid && (isGroupBy || isDistinct);
  const hasActionCol = headerGroups.some((group) => group.headers.some((header) => header.id === 'action'));
  return (
    <div ref={wrapperRef} className={initiateClass(hasRowSelect, isGroupBy, activateDataGrid, isDistinct)}>
      <Wrapper data-testid="CustomGridComponent">
        <Table {...getTableProps()} data-testid="TableComponent" style={!flag ? styleTable : {}}>
          <caption>{caption}</caption>
          {renderHeader({ flag, headerGroups, isFilterable, isColumnResizable, hasRowSelect, hasCheckbox, isGroupByOrDistinct, hasActionCol })}
          {page.length > 0 && (
          <tbody {...getTableBodyProps()} id={tbodyId}>
            {page.map((row, rowNum) => {
              prepareRow(row);
              const rowProps = row.getRowProps();
              return tableRow({ rowNum,
                row,
                rowProps,
                hasRowSelect,
                onGridRowClick,
                tbodyId,
                caption,
                isSelected: rowNum === selectedRowIndex,
                canClick: canClick === undefined ? true : canClick,
                flag,
              });
            })}
          </tbody>
          )}
          {page.length === 0 && showMessageOnNoData({ activateDataGrid, columns, isPeriodDefinition, t, isManualAdj, customNoDataMsg, lookup, isCompCheckbox })}
        </Table>
      </Wrapper>
    </div>
  );
};
CustomGrid.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})),
  columns: PropTypes.arrayOf(PropTypes.shape({})),
  onFilterChange: PropTypes.func.isRequired,
  onSortByChange: PropTypes.func.isRequired,
  getSelectedRows: PropTypes.func,
  onColumnResizeChange: PropTypes.func.isRequired,
  isFilterable: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  isSortable: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  isColumnResizable: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  allowClientSideInteractions: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  isSortIconClickable: PropTypes.string,
  hasRowSelect: PropTypes.string,
  getToggleAllRowsSelectedProps: PropTypes.func,
  row: PropTypes.arrayOf(PropTypes.shape({})),
  columnOrder: PropTypes.arrayOf(PropTypes.shape({})),
  caption: PropTypes.string,
  onGridRowClick: PropTypes.func,
  // Props to check if data on this grid is dependent on data selection from another grid
  isDependentGrid: PropTypes.bool,
  selectedRowIndex: PropTypes.number,
  selectAll: PropTypes.bool,
};
CustomGrid.defaultProps = {
  data: [],
  columns: [],
  row: [],
  hasRowSelect: null,
  isSortIconClickable: null,
  isSortable: false,
  allowClientSideInteractions: null,
  isColumnResizable: null,
  isFilterable: false,
  getToggleAllRowsSelectedProps: () => undefined,
  getSelectedRows: () => undefined,
  columnOrder: null,
  caption: '',
  onGridRowClick: () => undefined,
  selectedRowIndex: null,
  isDependentGrid: false,
  selectAll: true,
  // set true if Grids data depend on another grid
};

export default CustomGrid;
