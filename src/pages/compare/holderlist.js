import React, { useState, useEffect } from "react"
import "./holderlist.scss"
import { Row, Col, Input, Select, Button, Tooltip, Table , Modal, message } from "antd"
import { holderTypes } from "../../utils/common"
import PeriodCompare from "../../components/periodCompare"
import { getAllPeriod, getAllData, getGroupFilePath } from "../../utils/fileParse"
import { sortHolderAmount, formatNumber, getHolderByType, onExportToExcel } from "../../utils/common"
import { Link } from 'react-router-dom'
import useKeyPress from "../../hooks/useKeyPress"


const InputGroup = Input.Group
const { Option } = Select


const Holderlist = (props) => {
    // 股东名称
    const [ holderNameValue, setHolderNameValue ] = useState("")
    // 临时存放
    let holderNameValueCopy = holderNameValue
    // 股东分组
    const [ groupName, setGroupName ] = useState("")
    // 分组内人员的id
    const [ groupIdNumbers, setGroupIdNumbers] = useState([])
    let groupIdNumbersCopy = groupIdNumbers
    // 所有的股东分组
    const [ groupArr, setGroupArr ] = useState([])
    // 股东性质
    const [ holderTypeValue, setHolderTypeValue ] = useState(null)
    let holderTypeValueCopy = holderTypeValue
    // 排名区间
    const [ rankRegion, setRankRegion ] = useState(null)
    let rankRegionCopy = rankRegion
    // 股东的性质table
    const [ holderData, setHolderData ] = useState([])
    // 股东列表对比
    const [ compareTables, setCompareTables ] = useState([])
    // 所有日期
    const [allPeriodArr, setAllPeriodArr] = useState([])
    // 临时存放数据 copy
    let allPeriodArrCopy = allPeriodArr
    // 所有日期，及相应信息
    const [allPeriodObjArr, setAllPeriodObjArr] = useState([])
    // 选择的对比期数
    const [selectPeriod, setSelectPeriod] = useState([])

    const [ visible, setVisible ] = useState(false)
    
    // 所有日期的股东持股数据
    const [allData, setAllData] = useState({})


    const rankRegionArr = ["前10名", "前20名", "前30名", "前50名", "前100名"]

    const showExport = true

    const leftFixedColumns = [
        {
            title: '股东名称',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            ellipsis: true,
            render: (text, record, index) => {
                let rankArr = []
                if (allData) {
                    for (const key in allData) {
                        if (allData.hasOwnProperty(key)) {
                            if (index <= allData[key].length - 1) {
                                rankArr.push(allData[key][index].rankIndex)
                            }
                        }
                    }
                }
                let data = { name: text, period: allPeriodArr[0], idNumber: record.id_number, type: 1, holderType: record.holder_type, rank: rankArr }
                let path = {
                    pathname: '/detail',
                    query: data,
                };
                return (
                    <Link to={path}><span>{text}</span></Link>
                )
            }
        },
        {
            title: '股东性质',
            dataIndex: 'nature',
            key: 'nature',
            align: 'right',
            width: 120
        }
    ]

    // 引入公共hooks -- 当点击enter键盘的时候触发
    const enterPressed = useKeyPress(13)

    const tableColumns = [
        {
            title: '排名',
            dataIndex: 'rank',
            key: 'rank',
            align: 'center',
            width: 50
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
            title: '较上期持股数量变动(股)',
            dataIndex: 'amountChange',
            align: 'center',
            key: 'amountChange',
        render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}>{text > 0 ? "+" : ""}{formatNumber(text)}</span>
        },
        {
            title: '较上期持股比例变动(%)',
            dataIndex: 'ratioChange',
            align: 'center',
            key: 'ratioChange',
            render: text => <span style={{color: text > 0 || text === "新进" ? "#FF6565" : (text < 0 || text === "退出" ? "#1EC162" : "")}}>{text > 0 ? "+" : ""}{text}</span>
        }
    ]

    const getGroups = () => {
        let groups = getGroupFilePath()
        if (groups) {
            groups = JSON.parse(groups)
        } else {
            groups = []
        }
        setGroupArr(groups)
    }

    // 股东名称
    const holderNameInputChange = (e) => {
        holderNameValueCopy = e.target.value
        setHolderNameValue(e.target.value)
    }

    // 股东分组
    const selectGroupChange = (value) => {
        setGroupName(value)
        groupArr.forEach(item => {
            if (item.groupName === value) {
                setGroupIdNumbers(item.idNumbers)
                groupIdNumbersCopy = item.idNumbers
            }
        })
    }

    // 股东性质
    const holderTypeChange = (value) => {
        holderTypeValueCopy = value
        setHolderTypeValue(value)
    }

    // 排名区间
    const rankRegionChange = (value) =>{
        rankRegionCopy = value
        setRankRegion(value)
    }

    const search = () => {
        handleData(selectPeriod, allData)
    }

    const reset = () => {
        setHolderNameValue("")
        setHolderTypeValue(null)
        setRankRegion(null)
        setGroupName("")
        setGroupIdNumbers([])
        // 因为改变状态是异步的，所以这么写
        holderNameValueCopy = ""
        holderTypeValueCopy = null
        rankRegionCopy = null
        groupIdNumbersCopy = []
        handleData(selectPeriod, allData)
    }

    const deleteCompare = (item) => {
        let periodArr = selectPeriod
        if (periodArr.indexOf(item.period) > -1) {
            periodArr.splice(periodArr.indexOf(item.period), 1)
        }
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
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

    // 选择对比期数
    const select = (index) => {
        let arr = allPeriodObjArr
        arr[index].selected = !arr[index].selected
        setAllPeriodObjArr([...arr])
    }

    // 对比所有期数
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
    // 清空对比期数
    const clearCompareData = () => {
        for (let y = 0; y < allPeriodObjArr.length; y++) {
            const item = allPeriodObjArr[y]
            item.selected = false
        }
        setSelectPeriod([])
        setAllPeriodObjArr(allPeriodObjArr)
        handleData([], allData)
    }

    const exportToExcel = () => {
        onExportToExcel("股东名称", selectPeriod, "股东列表对比")
    }

    const handleData = (selectPeriod, data) => {
        let allData = JSON.parse(JSON.stringify(data))
        if (selectPeriod.length === 0) {
            setCompareTables([])
            setHolderData([])
            return
        }
        // showLoading();
        // 筛选股东类型
        for(let key in allData) {
            if (allData.hasOwnProperty(key)) {
                if (holderTypeValueCopy) {
                    allData[key] = allData[key].filter(item => {
                        return item.holder_type == holderTypeValue
                    })
                }
                // 筛选股东分组
                if (groupIdNumbersCopy.length > 0) {
                    allData[key] = allData[key].filter(item => {
                        return groupIdNumbersCopy.includes(item.id_number)
                    })
                }
                // 筛选排名区间
                if (rankRegionCopy) {
                    let index = parseInt(rankRegion.substr(1))
                    allData[key] = allData[key].slice(0, index)
                }
                // 筛选股东名称
                if (holderNameValueCopy) {
                    allData[key] = allData[key].filter(item => {
                        return item.holder_name.includes(holderNameValue)
                    })
                }
            }
        }
        console.log("allData", allData)
        let firstData = allData[selectPeriod[0]]
        // 这是股东的数据，包括名称，性质等信息
        let holderData = []
        let compareTables = []
        compareTables.push({
            period: selectPeriod[0],
            data: []
        })
        // 最新一期有哪些股东，把股东的证件号码push进去
        let lastHolderIdArr = []
        let lastHolderIdArrCopy = []
        for (let k = 0; k < firstData.length; k++) {
            let item = firstData[k]
            lastHolderIdArr.push(item.id_number)
            lastHolderIdArrCopy.push(item.id_number)
            holderData.push({
                key: k,
                title: item.holder_name,
                nature: getHolderByType(item.holder_type),
                id_number: item.id_number, // 证件号码是唯一的
                holder_type: item.holder_type
            })
            compareTables[0].data.push({
                key: k + 1,
                rank: item.rankIndex,
                amount: item.holder_amount,
                ratio: item.holder_ratio ? parseFloat(item.holder_ratio).toFixed(2) : "0.00",
                // 较上期持股数量变动
                amountChange: 0,
                // 较上期比例变动
                ratioChange: "0.00"
            })
        }
        for (const [index, key] of selectPeriod.entries()) {
            // 排除第一期key != selectPeriod[0]
            if (key !== selectPeriod[0]) {
                let item = allData[key]
                if (item.length > 0) {
                    // 把这一期的所有人的证件号码收集起来
                    let itemIdArr = []
                    item.forEach(temp => {
                        itemIdArr.push(temp.id_number)
                    })
                    let data = []
                    for (let i = 0; i < firstData.length; i++) {
                        let record = firstData[i]
                        for (let j = 0; j < item.length; j++) {
                            let pre_record = item[j]
                            let aIndex = index
                            // debugger
                            // 根据证件号码进行匹配每一个股东
                            if (pre_record.id_number === record.id_number) {
                                data.push({
                                    key: i + 1,
                                    rank: pre_record.rankIndex,
                                    amount: pre_record.holder_amount,
                                    ratio: pre_record.holder_ratio ? parseFloat(pre_record.holder_ratio).toFixed(2) : "0.00"
                                })
                                break
                            }
                            // 如果最新一期有这个股东，但是后面的期数没有这个股东，表示这个股东是新进的
                            if (!itemIdArr.includes(record.id_number)) {
                                data.push({
                                    key: i + 1,
                                    rank: '--',
                                    amount: '--',
                                    ratio: '--',
                                    amountChange: '--',
                                    ratioChange: "--"
                                })
                                // 那么需要在新的一期加上这个人是新进的，比如5月有这个股东，4月也有，但是3月没有，那么需要在4月上，标注这个股东是新进的
                                // 上一期数据
                                let period = selectPeriod[index - 1]
                                compareTables.forEach((item, y) => {
                                    if (item.period === period) {
                                        // 如果5月是新进的，那么4月所有数据为 "--"，如果后面还有3月的数据，同时要避免4月也写新进
                                        let iItem = compareTables[y].data[i]
                                        if (!(iItem.rank === "--" && iItem.amount === "--" && iItem.ratio === "--")){
                                            // 说明这一期也没有这个股东，那么就不需要写新进了
                                            compareTables[y].data[i].ratioChange = "新进"
                                            compareTables[y].data[i].amountChange = compareTables[y].data[i].amount
                                        }
                                    }
                                })
                                break
                            }
                            // 如果最新一期没有这个股东，后面的期数有这个股东，说明这个股东已经退出
                            if (!lastHolderIdArr.includes(pre_record.id_number)) {
                                // 这里插入的顺序是data.length，因为无法保证前面是否插入数据，所以不能用j
                                holderData.splice(data.length, 0, {
                                    title: pre_record.holder_name,
                                    nature: getHolderByType(pre_record.holder_type),
                                    id_number: pre_record.id_number,
                                    holder_type: pre_record.holder_type
                                })
                                // 加入一个就记住一个，防止后面的期数重复加入
                                lastHolderIdArr.push(pre_record.id_number)
                                // 还要把前面几期的数据加上这个退出的股东的数据
                                while(aIndex > 0) {
                                    let dPeriod = selectPeriod[aIndex - 1]
                                    compareTables.forEach((item, t) => {
                                        if(item.period === dPeriod) {
                                            compareTables[t].data.splice(data.length, 0, {
                                                rank: '--',
                                                amount: '--',
                                                ratio: '--',
                                                amountChange: '--',
                                                ratioChange: "退出"
                                            })
                                        }
                                    })
                                    aIndex--
                                }
                            }
                            // 把这一期多出来的股东，加到当期中
                            if (!lastHolderIdArrCopy.includes(pre_record.id_number)) {
                                let rankArr = []
                                data.forEach(item => {
                                    rankArr.push(item.rank)
                                })
                                // 如果已经导入过，就不需要导入了
                                if (!rankArr.includes(pre_record.rankIndex)) {
                                    data.push({
                                        rank: pre_record.rankIndex,
                                        amount: pre_record.holder_amount,
                                        ratio: pre_record.holder_ratio ? parseFloat(pre_record.holder_ratio).toFixed(2) : "0.00"
                                    })
                                }
                            }
                        }
                    }
                    compareTables.push({
                        period: key,
                        data: data
                    })
                }
            }
        }
        // 计算较上期变化
        for (let w = 0; w < compareTables.length; ++w) {
            let amountChange = "0.00"
            let ratioChange = "0.00"
             // 如果是最后一项
             if (w === compareTables.length - 1) {
                compareTables[w].data.forEach(item => {
                    // 如果这一期没有这个股东，那么不需要比较
                    if(!(item.rank === "--" && item.amount === "--" && item.ratio === "--")) {
                        item.amountChange = amountChange
                        item.ratioChange = ratioChange
                    }
                })
            } else {
                let currentItem = compareTables[w]
                let preItem = compareTables[w + 1]
                currentItem.data.forEach((item, q) => {
                    if (!(item.ratioChange === "新进")) {
                        // 如果这一期没有这个股东，那么不需要比较
                        if (!(item.rank === "--" && item.amount === "--" && item.ratio === "--")) {
                            item.amountChange = item.amount - preItem.data[q].amount
                            item.ratioChange = (item.ratio - preItem.data[q].ratio).toFixed(2)
                        }
                    }
                })

            }
        }
        console.log("compareTables -after", compareTables)
        // 给所有表格数据重新加上key
        holderData.forEach((item, k) => {
            item.key = k + 1
        })
        compareTables.forEach(table => {
            table.data.forEach((item, t) => {
                item.key = t + 1
            })
        })
        setCompareTables(compareTables)
        setHolderData(holderData)
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
        if (enterPressed) {
            search()
        }
    })

    useEffect(() => {
        init()
        getGroups()
        // 获取股东列表的持股数据
        if (allPeriodArrCopy.length > 0) {
            let allData = getAllData(allPeriodArrCopy)
            for (const key in allData) {
                if (allData.hasOwnProperty(key)) {
                    // 先对持股数据相加，即普通股数量加上信用股数量, 然后在排序
                    allData[key].forEach(item => {
                        if (item.credit_account) {
                            item.holder_amount = item.file_type === "t3" ? item.holder_amount : (item.holder_amount ? item.holder_amount + item.credit_amount : item.credit_amount)
                        }
                    })
                    allData[key] = allData[key].sort(sortHolderAmount)
                    // 给股东排名
                    allData[key].forEach((item, index) => {
                        item.rankIndex = index + 1
                    })
                }
            }
            console.log("allData", allData)
            setAllData({...allData})
            // 默认展示最新两期的数据
            let selectPeriod = allPeriodArrCopy.length === 1 ? [allPeriodArrCopy[0]] : [allPeriodArrCopy[0], allPeriodArrCopy[1]]
            setSelectPeriod([...selectPeriod])
            // 获取股东分组的数据-----后面补上
            getGroups()
            // 去处理数据
            handleData(selectPeriod, allData)
        } else {
            message.warn('您还未上传股东名册数据，请先上传数据！')
        }
    }, [])

    return (
        <div className="holderlist">
            <Row className="row" gutter={16}>
                <Col className="gutter-row" span={12}>
                    <Input size="large" placeholder="股东名称" value={holderNameValue} onChange={holderNameInputChange} addonBefore="股东名称" />
                </Col>
                <Col className="gutter-row" span={12}>
                    <InputGroup compact className="input-group-style">
                        <div className="input-select-head" style={{ 'flexBasis': 100 }}>股东分组</div>
                        <Select className="input-select-style" allowClear placeholder="请选择股东分组" value={groupName} onChange={selectGroupChange}>
                            {groupArr.map(group => (group.idNumbers.length && group.groupName) ? <Option key={group.groupName}>{group.groupName}</Option> : '')}
                        </Select>
                    </InputGroup>
                </Col>
            </Row>
            <Row className="row" gutter={16}>
                <Col className="gutter-row" span={12}>
                    <InputGroup compact className="input-group-style">
                        <div className="input-select-head">股东性质</div>
                        <Select className="input-select-style" allowClear placeholder="请选择股东性质" value={holderTypeValue} onChange={holderTypeChange}>
                            {Object.keys(holderTypes).map(key => holderTypes[key] ? <Option key={key}>{holderTypes[key]}</Option> : '')}
                        </Select>
                    </InputGroup>
                </Col>
                <Col className="gutter-row" span={9}>
                    <InputGroup compact className="input-group-style" >
                        <div className="input-select-head" style={{ 'flexBasis': 100 }}>排名区间</div>
                        <Select className="input-select-style" allowClear placeholder="请选择排名区间" value={rankRegion} onChange={rankRegionChange}>
                            {rankRegionArr.map(rank => <Option key={rank}>{rank}</Option>)}
                        </Select>
                    </InputGroup>
                </Col>
                <Col className="gutter-row" span={3} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button style={{ height: 40, width: 80, marginLeft: 10 }} type='primary' onClick={search}>搜索</Button>
                    <Button style={{ height: 40, width: 80, marginLeft: 10 }} onClick={reset}>重置</Button>
                </Col>
            </Row>

            <PeriodCompare 
                comparePeriod = {selectPeriod}
                showExport = {showExport}
                onExportToExcel = {exportToExcel}
                onOpenModal = {openModal}
                onCompareAllPeriod = {compareAllPeriod}
                onClearData = {clearCompareData}
            />
            {
                compareTables.length > 0 ?
                    <div className="table-content">
                        <div className="left-fixed">
                            <div className="left-title"></div>
                            <Table  columns={leftFixedColumns}  dataSource={holderData} pagination={false} />
                        </div>
                        <div className="right-scroll">
                            <div className="right-content" style={{width: `${compareTables.length * 600}px`}}>
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
        </div>
    )
}

export default Holderlist