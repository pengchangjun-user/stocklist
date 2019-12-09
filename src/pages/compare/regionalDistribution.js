import React, { useState, useEffect } from "react"
import "./regionalDistribution.scss"
import PeriodCompare from "../../components/periodCompare"
import { getAllPeriod, getAllData } from "../../utils/fileParse"
import { sortHolderAmount, formatNumber, sortByAmount, onExportToExcel, holderAddress } from "../../utils/common"
import { Table, Button, Modal, message } from "antd"

const RegionalDistribution = (props) => {

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
    const [addressData, setAddressData] = useState([])
    // 所有日期的股东持股数据
    const [allData, setAllData] = useState({})

    const [visible, setVisible] = useState(false)

    const showExport = true

    const leftFixedColumns = [
        {
            title: '股东地域',
            dataIndex: 'address',
            key: 'address',
            ellipsis: true
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
            render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}>{text}</span>
        }
    ]

    const openModal = () => {
        setVisible(true)
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

    const select = (index) => {
        let arr = allPeriodObjArr
        arr[index].selected = !arr[index].selected
        setAllPeriodObjArr([...arr])
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

    const handleData = (selectPeriod, allData) => {
        if (selectPeriod.length === 0) {
            setCompareTables([])
            return
        }
        // 把左侧的位置整理出来
        let firstData = allData[selectPeriod[0]]
        let addressObj = clearAddress(firstData)
        let addressTableData = []
        let compareTables = []
        let sortArr = []
        // 对各个地区的持有股份数相加，然后从大到小排序
        for (let key in addressObj) {
            if(addressObj.hasOwnProperty(key)) {
                let obj = {
                    key: key,
                    address: key,
                    amount: 0,
                    number: 0,
                    ratio: 0
                }
                addressObj[key].forEach(item => {
                    obj.amount += item.holder_amount
                    obj.number ++
                    obj.ratio += parseFloat(parseFloat(item.holder_ratio).toFixed(2))
                })
                sortArr.push(obj)
            }
        }
        sortArr = sortArr.sort(sortByAmount)
        addressTableData = sortArr.map((item, i) => {
            return {
                key: i + 1,
                address: item.address
            }
        })
        setAddressData(addressTableData)
        compareTables.push({
            period: selectPeriod[0],
            data: sortArr
        })
        // 把除了第一期的后面几期的数据都进行整理
        let allClearData = {}
        selectPeriod.forEach((item, i) => {
            if (i > 0) {
                allClearData[item] = clearAddress(allData[item])
            }
        })
        console.log("allClearData", allClearData)
        for(let m = 0, mLen = selectPeriod.length; m < mLen; ++m) {
            if (m > 0) {
                let period = selectPeriod[m]
                let data = []
                for(let j = 0, jLen = addressTableData.length; j < jLen; ++j) {
                    let obj = {
                        key: j,
                        number: 0,
                        amount: 0,
                        ratio: 0
                    }
                    for(let key in allClearData[period]) {
                        if (allClearData[period].hasOwnProperty(key)) {
                            if (addressTableData[j].address === key) {
                                allClearData[period][key].forEach(item => {
                                    obj.number++
                                    obj.amount += item.holder_amount
                                    obj.ratio += parseFloat(parseFloat(item.holder_ratio).toFixed(2))
                                })
                            }
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
                    item.ratio = item.ratio ? parseFloat(item.ratio).toFixed(2) : "0.00"
                })
            } else {
                let currentItem = compareTables[w]
                let preItem = compareTables[w + 1]
                currentItem.data.forEach((item, q) => {
                    let ratio1 = (item.ratio - preItem.data[q].ratio).toFixed(2)
                    item.ratioChange = ratio1 ? ratio1 : "0.00"
                    item.ratio = item.ratio ? parseFloat(item.ratio).toFixed(2) : "0.00"
                })
            }
        }
        setCompareTables(compareTables)
        console.log("compareTables", compareTables)
    }

    // 把地址归类汇总
    const clearAddress = (data) => {
        // 地址归类
        let addressTypesObj = {}
        let hasObj = {}
        // 省
        let provinceArr = Object.keys(holderAddress)
        for(let i = 0; i < data.length; ++i) {
            let address = data[i].address
            let flag = false
            // 首先看地址是否包含省的名字，如果有，就不用找去地级市
            for(let j = 0, jLen = provinceArr.length; j < jLen; ++j) {
                // 在开头能匹配上省的名称，这样能避免在地址的中间部分有跟省的名称相同的情况
                let pattern = new RegExp(`^${provinceArr[j]}`, "g")
                if(pattern.test(address)) {
                    flag = true
                    if (!hasObj[provinceArr[j]]) {
                        hasObj[provinceArr[j]] = true
                        addressTypesObj[provinceArr[j]] = []
                        addressTypesObj[provinceArr[j]].push(data[i])
                    } else {
                        addressTypesObj[provinceArr[j]].push(data[i])
                    }
                    break
                }
            }
            // 继续从地级市中查找
            if (!flag) {
                for(let key in holderAddress) {
                    if (holderAddress.hasOwnProperty(key)) {
                        for(let m = 0; m < holderAddress[key].length; ++m) {
                            if (address.includes(holderAddress[key][m])) {
                                if (!hasObj[key]) {
                                    hasObj[key] = true
                                    addressTypesObj[key] = []
                                    addressTypesObj[key].push(data[i])
                                } else {
                                    addressTypesObj[key].push(data[i])
                                }
                                break
                            }
                        }
                    }
                }
            }
        }
        return addressTypesObj
    }

    const exportToExcel = () => {
        onExportToExcel("股东地域", selectPeriod, "地域分布对比")
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
            setAllData({...allData})
            // 默认展示最新两期的数据
            let selectPeriod = allPeriodArrCopy.length === 1 ? [allPeriodArrCopy[0]] : [allPeriodArrCopy[0], allPeriodArrCopy[1]]
            setSelectPeriod([...selectPeriod])
            handleData(selectPeriod, allData)
        } else {
            message.warn('您还未上传股东名册数据，请先上传数据！')
        }
    }, [])

    return (
        <div className="regional">
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
                            <Table  columns={leftFixedColumns}  dataSource={addressData} pagination={false} />
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

export default RegionalDistribution