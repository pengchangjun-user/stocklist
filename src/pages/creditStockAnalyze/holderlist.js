import React, { useState, useEffect } from 'react'
import "./holderlist.scss"
import { Row, Col, Input, Select, Button, Table, Tag, Icon, message, Dropdown, Menu } from "antd"
import { holderTypes } from "../../utils/common"
import { getAllPeriod, getCreditFilePath } from "../../utils/fileParse"
import { sortByCreditAmount, formatNumber, getHolderByType, getRatio, onExportToExcel } from "../../utils/common"
import { Link } from 'react-router-dom'
import useKeyPress from "../../hooks/useKeyPress"

const InputGroup = Input.Group
const { Option } = Select
const { CheckableTag } = Tag

const Holderlist = () => {
    // 所有日期
    const [allPeriodArr, setAllPeriodArr] = useState([])
    // 选择的期数
    const [ periodValue, setPeriodValue ] = useState("")
    // 股东名称
    const [holderNameValue, setHolderNameValue] = useState("")
    // 临时存放
    let holderNameValueCopy = holderNameValue
    // 股东性质
    const [holderTypeValue, setHolderTypeValue] = useState(null)
    let holderTypeValueCopy = holderTypeValue
    // 原始的表格数据，搜索的数据都是从它来的
    const [ originTableData, setOriginTableData] = useState([])
    // 表格数据
    const [ tableData, setTableData ] = useState([])
    // 退出人员的表格数据
    const [outTableData, setOutTableData ] = useState([])
    // 新进股东
    const [ addHolderNum, setAddHolderNum ] = useState(0)
    // 增持股东
    const [ increaseHolderNum, setIncreaseHolderNum ] = useState(0)
    // 不变股东
    const [ sameHolderNum, setSameHolderNum ] = useState(0)
    // 减持股东
    const [ decreaseHolderNum, setDecreaseHolderNum ] = useState(0)
    // 退出股东
    const [ outHolderNum, setOutHolderNum ] = useState(0)
    // 全部股东
    const [ allHolderNum, setAllHolderNum ] = useState(0)
    const [ allTagChecked, setAllTagChecked ] = useState(false)
    const [ addTagChecked, setAddTagChecked ] = useState(false)
    const [ increaseTagChecked, setIncreaseTagChecked ] = useState(false)
    const [ decreaseTagChecked, setDecreaseTagChecked ] = useState(false)
    const [ sameTagChecked, setSameTagChecked ] = useState(false)
    const [ outTagChecked, setOutTagChecked ] = useState(false)

    // 引入公共hooks -- 当点击enter键盘的时候触发
    const enterPressed = useKeyPress(13)

    const columns = [
        {
            title: '股东名称',
            dataIndex: 'name',
            key: 'name',
            width: "33%",
            ellipsis: true,
            render: (text, record, index) => {
                var data = { name: text, period: periodValue, idNumber: record.idNumber, type: 2, holderType: record.nature }
                var path = {
                    pathname: '/detail',
                    query: data,
                }
                return (
                    <Link to={path}><span>{text}</span></Link>
                )
            }
        }, {
            title: '股东性质',
            align: 'center',
            dataIndex: 'nature',
            key: 'nature',
            width: "15%",
            render: text => {
                return getHolderByType(text)
            }
        }, {
            title: '信用持股数量(股)',
            align: 'center',
            dataIndex: 'amount',
            key: 'amount',
            width: "13%",
            render: text => {
                return formatNumber(text)
            }
        }, {
            title: '信用持股比例(%)',
            align: 'center',
            dataIndex: 'ratio',
            key: 'ratio',
            width: "13%",
        }, {
            title: '较上期持股变动数(股)',
            align: 'center',
            dataIndex: 'amountChange',
            key: 'amountChange',
            width: "13%",
            render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}><i>{text > 0 ? "+" : ""}</i>{formatNumber(text)}</span>
        }, {
            title: '持股比例变动(%)',
            align: 'center',
            dataIndex: 'ratioChange',
            key: 'ratioChange',
            width: "13%",
            render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}><i>{text > 0 ? "+" : ""}</i>{text}</span>
        }
    ]

    // 股东名称
    const holderNameInputChange = (e) => {
        holderNameValueCopy = e.target.value
        setHolderNameValue(e.target.value)
    }

    // 股东性质
    const holderTypeChange = (value) => {
        holderTypeValueCopy = value
        setHolderTypeValue(value)
    }

    const search = () => {
        let index = allPeriodArr.findIndex(item => item === periodValue)
        if (index < allPeriodArr.length - 1 && index > -1) {
            handleData([allPeriodArr[index], allPeriodArr[index + 1]])
        }
        if (index === allPeriodArr.length - 1) {
            handleData([allPeriodArr[index]])
        }
    }

    const reset = () => {
        setHolderNameValue("")
        setHolderTypeValue(null)
        // 因为改变状态是异步的，所以这么写
        holderNameValueCopy = ""
        holderTypeValueCopy = null
        search()
    }

    const renderDropdownMenu = () => {
        let items = []
        for (let p of allPeriodArr) {
            items.push(<Menu.Item key={p}>期数: {p}</Menu.Item>)
        }
        return (
            <Menu onClick={selectPeriod}>
                {items}
            </Menu>
        )
    }

    const selectPeriod = (item) => {
        setPeriodValue(item.key)
        let index = allPeriodArr.findIndex(period => period === item.key)
        if (index < allPeriodArr.length - 1 && index > -1) {
            handleData([allPeriodArr[index], allPeriodArr[index + 1]])
        }
        if (index === allPeriodArr.length - 1) {
            handleData([allPeriodArr[index]])
        }
    }

    // 点击tag时，进行搜索
    const tagSearch = (type) => {
        if (type === "all") {
            setTableData(originTableData)
        } else if (type === "add") {
            setTableData(originTableData.filter(item => item.new))
        } else if (type === "increase") {
            setTableData(originTableData.filter(item => item.increase))
        } else if (type === "decrease") {
            setTableData(originTableData.filter(item => item.decrease))
        } else if (type === "same") {
            setTableData(originTableData.filter(item => item.same))
        }else if (type === "out") {
            setTableData(outTableData)
        }
    }

    const handleTagAll = (checked) => {
        setAllTagChecked(checked)
        setAddTagChecked(false)
        setIncreaseTagChecked(false)
        setDecreaseTagChecked(false)
        setSameTagChecked(false)
        setOutTagChecked(false)
        tagSearch("all")
    }
    const handleTagAdd = (checked) => {
        setAddTagChecked(checked)
        setIncreaseTagChecked(false)
        setDecreaseTagChecked(false)
        setSameTagChecked(false)
        setOutTagChecked(false)
        setAllTagChecked(false)
        tagSearch("add")
    }
    const handleTagIncrease = (checked) => {
        setIncreaseTagChecked(checked)
        setDecreaseTagChecked(false)
        setSameTagChecked(false)
        setOutTagChecked(false)
        setAddTagChecked(false)
        setAllTagChecked(false)
        tagSearch("increase")
    }
    const handleTagDecrease = (checked) => {
        setDecreaseTagChecked(checked)
        setAllTagChecked(false)
        setAddTagChecked(false)
        setIncreaseTagChecked(false)
        setSameTagChecked(false)
        setOutTagChecked(false)
        tagSearch("decrease")
    }
    const handleTagSame = (checked) => {
        setSameTagChecked(checked)
        setDecreaseTagChecked(false)
        setAllTagChecked(false)
        setAddTagChecked(false)
        setIncreaseTagChecked(false)
        setOutTagChecked(false)
        tagSearch("same")
    }
    const handleTagOut = (checked) => {
        setOutTagChecked(checked)
        setSameTagChecked(false)
        setDecreaseTagChecked(false)
        setAllTagChecked(false)
        setAddTagChecked(false)
        setIncreaseTagChecked(false)
        tagSearch("out")
    }

    const handleData = (periods) => {
        let allTableData = []
        let creditDataArr = []
        for (let period of periods) {
            let data = getCreditFilePath(period, true)
            if (!data) {
                message.warn(`未查询到${period}期信用股东名册数据,请先上传数据！`);
                return
            } else {
                // 当期和前一期的数据，共两期数据
                creditDataArr.push(data)
            }
        }
        for (let i = 0; i < creditDataArr.length; ++i) {
            let arr = creditDataArr[i].recorders
            if (arr.length > 0) {
                // 筛选股东名称
                if (holderNameValueCopy) {
                    arr = arr.filter(item => {
                        return item.holder_name.includes(holderNameValueCopy)
                    })
                }
                // 筛选股东类型
                if (holderTypeValueCopy) {
                    arr = arr.filter(item => {
                        return item.holder_type == holderTypeValueCopy
                    })
                }
                creditDataArr[i].recorders = arr.sort(sortByCreditAmount)
            }
        }
        console.log("creditDataArr", creditDataArr)
        // 把当期和前一期的所有人的id放在数组中，来比对，找出新增和退出的人员信息
        let curAndPreIdNumbers = []
        let outTableData = []
        creditDataArr.forEach(cItem => {
            let arr = []
            let recorders = cItem.recorders
            let idArr = []
            recorders.forEach((dItem, index) => {
                idArr.push(dItem.id_number)
                arr.push({
                    key: index,
                    index: index + 1,
                    name: dItem.holder_name,
                    nature: dItem.holder_type,
                    amount: dItem.credit_amount,
                    idNumber: dItem.id_number,
                    ratio:  getRatio(dItem.credit_amount, cItem.credit_amount, false),
                    // 较上期持股数量变动
                    amountChange: 0,
                    // 较上期比例变动
                    ratioChange: "0.00"
                })
            })
            allTableData.push(arr)
            curAndPreIdNumbers.push(idArr)
        })
        // 如果有两期数据，就可以进行对比算出变动比例，新进，退出，增加等等
        if (allTableData.length === 2) {
            let cur = allTableData[0]
            let pre = allTableData[1]
            for(let i = 0; i < cur.length; ++i) {
                let iItem = cur[i]
                for(let j = 0; j < pre.length; ++j) {
                    let jItem = pre[j]
                    if (iItem.idNumber === jItem.idNumber) {
                        iItem.amountChange = iItem.amount - jItem.amount
                        iItem.ratioChange =  (iItem.ratio - jItem.ratio).toFixed(2)
                        // 搜索时用这个字段搜索
                        if (iItem.amountChange > 0) {
                            iItem.increase = true
                        } else if (iItem.amountChange < 0) {
                            iItem.decrease = true
                        } else {
                            iItem.same = true
                        }
                        break
                    }
                    // 如果这期有，往期没有，那么加一个字段new，搜索时用这个字段搜索
                    if (iItem.idNumber !== jItem.idNumber && j === pre.length -1) {
                        iItem.new = true
                    }
                }
            }
            // 找出退出人员名单
            for(let m = 0; m < pre.length; ++m) {
                if (!(curAndPreIdNumbers[0].includes(pre[m].idNumber))) {
                    outTableData.push(pre[m])
                }
            }
            // 退出人员个数
            setOutHolderNum(outTableData.length)
            let sameNum = 0
            let increaseNum = 0
            let decreaseNum = 0
            let newNum = 0
            for(let k = 0; k < allTableData[0].length; k++) {
                let aItem = allTableData[0][k]
                if (aItem.same) {
                    sameNum++
                }
                if (aItem.increase) {
                    increaseNum++
                }
                if (aItem.decrease) {
                    decreaseNum++
                }
                if (aItem.new) {
                    newNum++
                }
            }
            setIncreaseHolderNum(increaseNum)
            setSameHolderNum(sameNum)
            setDecreaseHolderNum(decreaseNum)
            setAddHolderNum(newNum)
            setAllHolderNum(allTableData[0].length)
        } else {
            setAllHolderNum(allTableData[0].length)
            setIncreaseHolderNum(0)
            setSameHolderNum(0)
            setDecreaseHolderNum(0)
            setAddHolderNum(0)
            setOutHolderNum(0)
        }
        console.log("allTableData", allTableData)
        setOutTableData(outTableData)
        setTableData(allTableData[0])
        setOriginTableData(allTableData[0])
    }

    const exportToExcel = () => {
        onExportToExcel("信用股东列表", [], "信用股东列表")
    }

    useEffect(() => {
        if (enterPressed) {
            search()
        }
    })

    useEffect(() => {
        let allPeriodArr = getAllPeriod()
        setAllPeriodArr([...allPeriodArr])
        let creditData = []
        if (allPeriodArr.length > 0) {
            setPeriodValue(allPeriodArr[0])
            allPeriodArr.length === 1 ? handleData([allPeriodArr[0]]) : handleData([allPeriodArr[0], allPeriodArr[1]])
        } else {
            message.warn('您还未上传信用股东名册数据，请先上传数据！')
        }
    }, [])



    return (
        <div className="credit-holderlist">
            <Row className="row" gutter={16}>
                <Col className="gutter-row" span={12}>
                    <Input size="large" placeholder="股东名称" value={holderNameValue} onChange={holderNameInputChange} addonBefore="股东名称" />
                </Col>
                <Col className="gutter-row" span={8}>
                    <InputGroup compact className="input-group-style">
                        <div className="input-select-head">股东性质</div>
                        <Select className="input-select-style" allowClear placeholder="请选择股东性质" value={holderTypeValue} onChange={holderTypeChange}>
                            {Object.keys(holderTypes).map(key => holderTypes[key] ? <Option key={key}>{holderTypes[key]}</Option> : '')}
                        </Select>
                    </InputGroup>
                </Col>
                <Col className="gutter-row btn-wrapper" span={4}>
                    <Button className="btn" type='primary' onClick={search}>搜索</Button>
                    <Button className="btn" onClick={reset}>重置</Button>
                </Col>
            </Row>
            <div className="period-select">
                {allPeriodArr.length > 0 && (<Dropdown overlay={renderDropdownMenu()}>
                    <Button>
                        期数: {periodValue || allPeriodArr[0]}<Icon type="down" />
                    </Button>
                </Dropdown>)}
                <Button icon="to-top" onClick={exportToExcel}>导出excel</Button>
            </div>
            <div className="tag">
                <CheckableTag checked={allTagChecked} onChange={handleTagAll} >全部 {allHolderNum}</CheckableTag>
                <CheckableTag checked={addTagChecked} onChange={handleTagAdd} >新进 {addHolderNum}</CheckableTag>
                <CheckableTag checked={increaseTagChecked} onChange={handleTagIncrease} >增持 {increaseHolderNum}</CheckableTag>
                <CheckableTag checked={sameTagChecked} onChange={handleTagSame} >不变 {sameHolderNum}</CheckableTag>
                <CheckableTag checked={decreaseTagChecked} onChange={handleTagDecrease} >减持 {decreaseHolderNum}</CheckableTag>
                <CheckableTag checked={outTagChecked} onChange={handleTagOut} >退出 {outHolderNum}</CheckableTag>
            </div>
            <div className="holderlist-table">
                <div className="fixed-table-head">
                    <div style={{width: "33%", textAlign: "left", paddingLeft: "10px"}}>股东名称</div>
                    <div style={{width: "15%"}}>股东性质</div>
                    <div style={{width: "13%"}}>信用持股数量(股)</div>
                    <div style={{width: "13%"}}>信用持股比例(%)</div>
                    <div style={{width: "13%"}}>较上期持股变动数(股)</div>
                    <div style={{width: "13%"}}>持股比例变动(%)</div>
                </div>
                <Table dataSource={tableData} columns={columns} pagination={false} />
            </div>
            
        </div>
    )
}

export default Holderlist