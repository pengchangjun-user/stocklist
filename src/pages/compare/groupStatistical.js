import React, { useState, useEffect } from "react"
import "./groupStatistical.scss"
import PeriodCompare from "../../components/periodCompare"
import { getAllPeriod, getAllData, setGroupFilePath, getGroupFilePath } from "../../utils/fileParse"
import { sortHolderAmount, formatNumber, getHolderByType, sortByAmount, onExportToExcel } from "../../utils/common"
import { Table, Button, Modal, Input, Checkbox, message, Icon } from "antd"
import { Link } from 'react-router-dom'

const confirm = Modal.confirm

const GroupStatistical = (props) => {
    // 所有日期
    const [allPeriodArr, setAllPeriodArr] = useState([])
    // 临时存放数据 copy
    let allPeriodArrCopy = allPeriodArr
    // 所有日期，及相应信息
    const [allPeriodObjArr, setAllPeriodObjArr] = useState([])
    // 选择的对比期数
    const [selectPeriod, setSelectPeriod] = useState([])
    // 对比table
    const [compareTables, setCompareTables] = useState([])
    const [groupData, setGroupData] = useState([])
    // 所有日期的股东持股数据
    const [allData, setAllData] = useState({})
    // 弹框--股东分组的数据
    const [ holderSetArr, setHolderSetArr] = useState([])
    // 所有的分组
    const [ groupsArr, setGroupsArr ] = useState([])
    // 弹框--股东分组的名称
    const [ addGroupName, setAddGroupName ] = useState("")
    // 弹框--股东的id
    const [ idNumbers, setIdNumbers ] = useState([])
    // 编辑的那个分组
    const [ selectEditGroup, setSelectEditGroup ] = useState({})

    const [visible, setVisible] = useState(false)
    const [settingVisible, setSettingVisible] = useState(false)
    const [editVisible, setEditVisible] = useState(false)

    const showExport = true
    const showAddGroup = true

    const leftFixedColumns = [
        {
            title: '分组名称',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => {
                let data = { name: text, period: allPeriodArr[0], idNumbers: record.idNumbers }
                let path = {
                    pathname: '/groupDetail',
                    query: data,
                };
                return (
                    <Link to={path}>
                        <span>{text}
                            <Icon type="edit" className="edit-icon" onClick={(e) => {editGroup(e, record)}} />
                            <Icon type="delete" onClick={(e) => {deleteGroup(e, record)}}  />
                        </span>
                    </Link>
                )
            }
        }
    ]

    const setColumns = [
        {
            title: '排名',
            dataIndex: 'rank'
        }, {
            title: '股东名称',
            dataIndex: 'name',
            align: 'left',
        }, {
            title: '股东性质',
            dataIndex: 'nature',
            align: 'right'
        }, {
            title: '持股数量（股）',
            dataIndex: 'amount',
            align: 'center',
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        }, {
            title: '持股比例（%）',
            dataIndex: 'ratio',
            align: 'center'
        }, {
            title: '是否选中',
            dataIndex: 'id_number',
            align: 'center',
            render: text => {
                return <Checkbox checked={idNumbers.includes(text)} onChange={() => {
                    checkChange(text)
                }} />
            }
        }
    ]

    const tableColumns = [
        {
            title: '股东数量(户)',
            dataIndex: 'number',
            key: 'number',
            align: 'center'
        },
        {
            title: '持股数量(股)',
            dataIndex: 'amount',
            key: 'amount',
            align: 'center',
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        },
        {
            title: '持股比例(%)',
            dataIndex: 'ratio',
            align: 'center',
            key: 'ratio'
        },
        {
            title: '较上期持股比例变动(%)',
            dataIndex: 'ratioChange',
            align: 'center',
            key: 'ratioChange',
            render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}>{text > 0 ? "+" : ""}{text}</span>
        }
    ]


    const openModal = () => {
        setVisible(true)
    }
    const handleOk = () => {
        let selectPeriod = []
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            let item = allPeriodObjArr[y]
            if (item.selected) {
                selectPeriod.push(item.value)
            }
        }
        selectPeriod.sort().reverse()
        setSelectPeriod(selectPeriod)
        setVisible(false)
        handleData(selectPeriod, allData)
    }

    const handleCancel = () => {
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            if (selectPeriod.includes(item.value)) {
                item.selected = true
            } else {
                item.selected = false
            }
        }
        setAllPeriodObjArr(allPeriodObjArr)
        setVisible(false)
    }

    const select = (index) => {
        let arr = allPeriodObjArr
        arr[index].selected = !arr[index].selected
        setAllPeriodObjArr([...arr])
    }

    const compareAllPeriod = () => {
        let selectPeriod = []
        allPeriodArr.forEach(item => {
            selectPeriod.push(item)
        })
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            item.selected = true
        }
        selectPeriod.sort().reverse()
        setSelectPeriod(selectPeriod)
        setAllPeriodObjArr(allPeriodObjArr)
        handleData(selectPeriod, allData)
    }

    const clearCompareData = () => {
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            item.selected = false
        }
        setSelectPeriod([])
        setAllPeriodObjArr(allPeriodObjArr)
        handleData([], allData)
    }

    const deleteCompare = (item) => {
        let periodArr = selectPeriod
        if (periodArr.indexOf(item.period) > -1) {
            periodArr.splice(periodArr.indexOf(item.period), 1)
        }
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            let item = allPeriodObjArr[y]
            if (periodArr.indexOf(item.value) > -1) {
                item.selected = true
            } else {
                item.selected = false
            }
        }
        setAllPeriodObjArr(allPeriodObjArr)
        periodArr.sort().reverse()
        setSelectPeriod(periodArr)
        handleData(selectPeriod, allData)
    }

    
    const openSetModal = () => {
        setIdNumbers([])
        setAddGroupName("")
        setSettingVisible(true)
    }

    const handleSetOk = () => {
        if (addGroupName.length === 0) {
            message.error('分组名称不能为空！');
            return;
        }
        let exsit = false
        for (let i = 0; i < groupsArr.length; i++) {
            if (groupsArr[i].groupName === addGroupName) {
                exsit = true
                break
            }
        }
        if (exsit) {
            message.error('已经存在相同的分组名称！')
            return
        }
        addGroup()
        setSettingVisible(false)
    }

    // 增加分组
    const addGroup = () => {
        let groups = getGroupFilePath()
        if (groups) {
            groups = JSON.parse(groups)
        } else {
            groups = []
        }
        let group = {
            idNumbers: idNumbers,
            groupName: addGroupName,
            memberList: []
        }
        groups.unshift(group)
        setGroupFilePath(groups)
        handleData(selectPeriod, allData)
    }

    // 编辑分组
    const editGroup = (e, record) => {
        e.preventDefault()
        setAddGroupName(record.name)
        setIdNumbers(record.idNumbers)
        setSelectEditGroup(record)
        setEditVisible(true)
    }

    const handleEditOk = () => {
        if (addGroupName.length === 0) {
            message.error('分组名称不能为空！');
            return;
        }
        let exsit = false
        for (let i = 0; i < groupsArr.length; i++) {
            if (groupsArr[i].groupName === addGroupName && addGroupName !== selectEditGroup.name) {
                exsit = true
                break
            }
        }
        if (exsit) {
            message.error('已经存在相同的分组名称！')
            return
        }
        editGroupInfo(selectEditGroup, addGroupName, idNumbers)
        setEditVisible(false)
    }

    const editGroupInfo = (selectEditGroup, addGroupName, idNumbers) => {
        let groups = getGroupFilePath()
        if (groups) {
            groups = JSON.parse(groups);
        } else {
            groups = []
        }
        let group = {
            idNumbers: idNumbers,
            groupName: addGroupName
        }
        let achor = -1
        for (let j = 0; j < groups.length; j++) {
            if (groups[j].groupName === selectEditGroup.name) {
                achor = j
                break
            }
        }
        if (achor > -1) {
            groups.splice(achor, 1, group)
        }
        setGroupFilePath(groups)
        handleData(selectPeriod, allData)
    }

    const handleEditCancel = () => {
        setEditVisible(false)
    }

    // 删除分组
    const deleteGroup = (e, record) => {
        e.preventDefault()
        confirm({
            title: '提示',
            content: `确定删除该条分组${record.name}数据吗?`,
            centered: true,
            cancelText: '取消',
            okText: '确定',
            onOk() {
                deleteGroupInfo(record)
            },
            onCancel() {
            }
        })
    }

    const deleteGroupInfo = (record) => {
        let groups = getGroupFilePath()
        if (groups) {
            groups = JSON.parse(groups)
            let achor = -1
            for (let i = 0; i < groups.length; i++) {
                if (groups[i].groupName === record.name) {
                    achor = i
                    break
                }
            }
            if (achor > -1) {
                groups.splice(achor, 1)
            }
        }
        setGroupFilePath(groups)
        handleData(selectPeriod, allData)
    }

    const handleSetCancel = () => {
        setSettingVisible(false)
    }

    const checkChange = (id) => {
        let idArr = idNumbers.slice()
        let i = idArr.indexOf(id)
        if (i == -1) {
            idArr.push(id)
        } else {
            idArr.splice(i, 1)
        }
        setIdNumbers([...idArr])
    }

    const handleData = (selectPeriod, allData) => {
        if (selectPeriod.length === 0) {
            setCompareTables([])
            return
        }
        let groups = getGroupFilePath()
        if (groups) {
            groups = JSON.parse(groups)
        } else {
            groups = []
        }
        setGroupsArr(groups)
        let firstData = allData[selectPeriod[0]]
        // 左侧表格数据
        let groupData = []
        let compareTables = []
        for (let i = 0; i < groups.length; i++) {
            let gItem = groups[i]
            let idNumbers = gItem.idNumbers || []
            groupData.push({
                key: i,
                name: gItem.groupName,
                idNumbers: idNumbers
            })
        }
        // 先拿到最新一期的数据
        let firstChildData = []
        for(let j = 0, jLen = groupData.length; j < jLen; ++j) {
            let obj = {
                name: groupData[j].name,
                number: 0,
                amount: 0,
                ratio: 0,
                ratioChange: 0
            }
            for (let n = 0, nLen = firstData.length; n < nLen; ++n) {
                let child = firstData[n]
                if (groupData[j].idNumbers.includes(child.id_number)) {
                    obj.key = j
                    obj.number += 1
                    obj.amount += child.holder_amount
                    obj.ratio += parseFloat(parseFloat(child.holder_ratio).toFixed(2))
                }
            }
            firstChildData.push(obj)
        }
        firstChildData = firstChildData.sort(sortByAmount)
        // 根据第一期的数据，对groupData进行排序
        let groupDescArr = []
        firstChildData.forEach(item => {
            groupData.forEach(group => {
                if (group.name === item.name) {
                    groupDescArr.push(group)
                }
            })
        })
        groupData = groupDescArr
        compareTables.push({
            period: selectPeriod[0],
            data: firstChildData
        })
        // 对后面的每一期数据进行整理
        for(let q = 0, qLen = selectPeriod.length; q < qLen; ++q) {
            if (q > 0) {
                let period = selectPeriod[q]
                let data = []
                for(let j = 0, jLen = groupData.length; j < jLen; ++j) {
                    let obj = {
                        name: groupData[j].name,
                        number: 0,
                        amount: 0,
                        ratio: 0
                    }
                    for (let n = 0, nLen = allData[period].length; n < nLen; ++n) {
                        let item = allData[period][n]
                        if (groupData[j].idNumbers.includes(item.id_number)) {
                            obj.key = j
                            obj.number += 1
                            obj.amount += item.holder_amount
                            obj.ratio += parseFloat(parseFloat(item.holder_ratio).toFixed(2))
                        }
                    }
                    data.push(obj)
                }
                compareTables.push({
                    period: period,
                    data: data
                })
            }
        }
        for (let w = 0; w < compareTables.length; ++w) {
            let ratioChange = "0.00"
             // 如果是最后一项
             if (w === compareTables.length - 1) {
                compareTables[w].data.forEach(item => {
                    item.ratioChange = ratioChange
                    item.ratio = item.ratio ? item.ratio.toFixed(2) : "0.00"
                })
            } else {
                let currentItem = compareTables[w]
                let preItem = compareTables[w + 1]
                currentItem.data.forEach((item, q) => {
                    let ratio1 = (item.ratio - preItem.data[q].ratio).toFixed(2)
                    item.ratioChange = ratio1 ? ratio1 : "0.00"
                    item.ratio = item.ratio ? item.ratio.toFixed(2) : "0.00"
                })
            }
        }
        setCompareTables(compareTables)
        setGroupData(groupData)
    }

    const exportToExcel = () => {
        onExportToExcel("分组名称", selectPeriod, "分组统计对比")
    }

    const init = () => {
        let allPeriodArr = getAllPeriod()
        let allPeriodObjArr = []
        for (let i = 0; i < allPeriodArr.length; i++) {
            allPeriodObjArr.push({
                selected: i === 0 || i === 1 ? true : false,
                value: allPeriodArr[i]
            })
        }
        allPeriodArrCopy = allPeriodArr
        setAllPeriodArr([...allPeriodArr])
        setAllPeriodObjArr([...allPeriodObjArr])
    }

    useEffect(() => {
        init()
        if (allPeriodArrCopy.length > 0) {
            let allData = getAllData(allPeriodArrCopy)
            for (const key in allData) {
                if (allData.hasOwnProperty(key)) {
                    // 先对持股数据相加，即普通股数量加上信用股数量
                    allData[key].forEach(item => {
                        if (item.credit_account) {
                            item.holder_amount = item.file_type === "t3" ? item.holder_amount : (item.holder_amount ? item.holder_amount + item.credit_amount : item.credit_amount)
                        }
                    })
                    allData[key] = allData[key].sort(sortHolderAmount)
                }
            }
            console.log("allData", allData)
            setAllData({...allData})
            // 取最新一期的股东作为分组的依据
            if (allData[allPeriodArrCopy[0]].length > 0) {
                let holderSetArr = []
                for (let i = 0; i < allData[allPeriodArrCopy[0]].length; i++) {
                    let mItem = allData[allPeriodArrCopy[0]][i]
                    let obj = {
                        key: i + 1,
                        rank: i + 1,
                        name: mItem.holder_name,
                        nature: getHolderByType(mItem.holder_type),
                        amount: mItem.holder_amount,
                        ratio: mItem.holder_ratio ? parseFloat((mItem.holder_ratio * 1).toFixed(2)) : "0.00",
                        id_number: mItem.id_number
                    }
                    holderSetArr.push(obj)
                }
                setHolderSetArr(holderSetArr)
            }
            
            // 默认展示最新两期的数据
            let selectPeriod = allPeriodArrCopy.length === 1 ? [allPeriodArrCopy[0]] : [allPeriodArrCopy[0], allPeriodArrCopy[1]]
            setSelectPeriod([...selectPeriod])
            handleData(selectPeriod, allData)
        } else {
            message.warn('您还未上传股东名册数据，请先上传数据！')
        }
    }, [])



    return (
        <div className="group-statistical">
            <PeriodCompare 
                comparePeriod = {selectPeriod}
                showExport = {showExport}
                onExportToExcel = {exportToExcel}
                showAddGroup = {showAddGroup}
                onOpenModal = {openModal}
                onOpenSetModal = {openSetModal}
                onCompareAllPeriod = {compareAllPeriod}
                onClearData = {clearCompareData}
            />
            {
                groupsArr.length > 0 ? 
                    <div>
                        {
                            compareTables.length > 0 ?
                                <div className="table-content">
                                    <div className="left-fixed">
                                        <div className="left-title"></div>
                                        <Table  columns={leftFixedColumns}  dataSource={groupData} pagination={false} />
                                    </div>
                                    <div className="right-scroll">
                                        <div className="right-content" style={{width: `${compareTables.length * 480}px`}}>
                                            {
                                                compareTables.map((item, i) => (
                                                    <div key={i} className="compare-table">
                                                        <div className="left-title">
                                                            {
                                                                i === 0 ? <span className="new-icon"></span> : ""
                                                            }
                                                            <span className="period">{item.period}</span>
                                                            <span className="close-icon" onClick={() => {deleteCompare(item)}}></span>
                                                        </div>
                                                        <Table columns={tableColumns}  dataSource={item.data} pagination={false} />
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                </div>
                                :
                                <div>
                                    {
                                        allPeriodArr.length === 0 ? 
                                            <div className="add-compare-btn">没有查询到对比数据</div>
                                            :
                                            <div className="add-compare-btn">
                                                <Button type="default" icon="plus" onClick={openModal}>请添加对比期数</Button>
                                            </div>
                                    }
                                </div>
                        }
                    </div>
                    :
                    <div className="add-compare-btn">
                        <Button type="default" icon="plus" onClick={openSetModal}>新增分组</Button>
                    </div>
            }
            <Modal
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText={"确定"}
                cancelText={"取消"}
                width={646}
            >
                <div className="modal-title">
                    添加对比期数
                </div>
                <div className="modal-btns">
                    {
                        allPeriodObjArr.map((item, index) => (
                            <a key={index} className={item.selected ? 'selected' : ''} onClick={() => {select(index)}}>
                                {item.value}
                                {
                                    index === 0 ? <i className="new-icon"></i> : ""
                                }
                            </a>
                        ))
                    }
                </div>
            </Modal>
            {/* 新增分组 */}
            <Modal
                okText="完 成"
                cancelText="取 消"
                visible={settingVisible}
                onOk={handleSetOk}
                onCancel={handleSetCancel}
                width={1000}>
                <div className="set-group-title">新增分组</div>
                <div className="input-wrap">
                    <div style={{ width: 80 }}>分组名称:</div>
                    <Input value={addGroupName} onChange={(e) => {setAddGroupName(e.target.value)}} />
                </div>
                <Table dataSource={holderSetArr} columns={setColumns} />
            </Modal>
            {/* 编辑分组 */}
            <Modal
                okText="完 成"
                cancelText="取 消"
                visible={editVisible}
                onOk={handleEditOk}
                onCancel={handleEditCancel}
                width={1000}>
                <div className="set-group-title">编辑分组</div>
                <div className="input-wrap">
                    <div style={{ width: 80 }}>分组名称:</div>
                    <Input value={addGroupName} onChange={(e) => {setAddGroupName(e.target.value)}} />
                </div>
                <Table dataSource={holderSetArr} columns={setColumns} />
            </Modal>
        </div>
    )
}

export default GroupStatistical