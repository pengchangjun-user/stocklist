import React, { useState, useEffect } from 'react'
import "./managerType.scss"
import { Button, Table, Icon, Dropdown, Menu, message, Spin  } from "antd"
import { getAllPeriod, getAllData } from "../../utils/fileParse"
import { sortHolderAmount, formatNumber, getHolderByType, onExportToExcel } from "../../utils/common"
import { Link } from 'react-router-dom'
import { findWhichCharacter, parseCharacterFile } from "../../utils/excelParse"
import appGlobal from "../../global/global"

const path = window.require("path")

const ManagerType = () => {
    // 所有日期
    const [allPeriodArr, setAllPeriodArr] = useState([])
    // 选择的期数
    const [ periodValue, setPeriodValue ] = useState("")
    // 表格数据
    const [ tableData, setTableData ] = useState([])
    // 管理人
    const [ managerPeopleArr, setManagerPeopleArr ] = useState([])
    // 所有的管理人即对应的成员信息
    const [ managerData, setManagerData ] = useState({})
    const [ currentIndex, setCurrentIndex ] = useState(0)
    const [ loadingFlag, setLoadingFlag ] = useState(false)
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
            if (text === "合计") {
                return <span>{text}</span>
            } else {
                return (
                    <Link to={path}><span>{text}</span></Link>
                )
            }
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
        title: '机构持股数量(股)',
        align: 'center',
        dataIndex: 'amount',
        key: 'amount',
        width: "13%",
        render: text => {
            return formatNumber(text)
        }
    }, {
        title: '机构持股比例(%)',
        align: 'center',
        dataIndex: 'ratio',
        width: "13%",
        key: 'ratio'
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

    const exportToExcel = () => {
        onExportToExcel("按管理员分类", [],  "管理员分类列表")
    }

    const handleData = (periods) => {
        let allTableData = []
        let allData = getAllData(periods)
        if (allData) {
            for (let key in allData) {
                if (allData.hasOwnProperty(key)) {
                    // 先把机构股东筛选出来
                    allData[key] = allData[key].sort(sortHolderAmount).filter(item => {
                        return String(item.holder_type).charAt(0) === '2'
                    })
                    // 先对持股数据相加，即普通股数量加上信用股数量, 然后在排序
                    allData[key].forEach(item => {
                        if (item.credit_account) {
                            item.holder_amount = item.file_type === "t3" ? item.holder_amount : (item.holder_amount ? item.holder_amount + item.credit_amount : item.credit_amount)
                        }
                    })
                }
            }
            periods.forEach(pItem => {
                let arr = []
                let data = allData[pItem]
                data.forEach((dItem, index) => {
                    arr.push({
                        key: index,
                        index: index + 1,
                        name: dItem.holder_name,
                        nature: dItem.holder_type,
                        amount: dItem.holder_amount,
                        idNumber: dItem.id_number,
                        ratio: dItem.holder_ratio ? parseFloat((dItem.holder_ratio * 1)).toFixed(2) : "0.00",
                        // 较上期持股数量变动
                        amountChange: 0,
                        // 较上期比例变动
                        ratioChange: "0.00"
                    })
                })
                allTableData.push(arr)
            })
            // 如果有两期数据，就可以进行对比算出变动比例
            if (allTableData.length === 2) {
                let cur = allTableData[0]
                let pre = allTableData[1]
                for(let i = 0; i < cur.length; ++i) {
                    let iItem = cur[i]
                    for(let j = 0; j < pre.length; ++j) {
                        let jItem = pre[j]
                        if (iItem.idNumber === jItem.idNumber) {
                            iItem.amountChange = iItem.amount - jItem.amount
                            iItem.ratioChange =  parseFloat(iItem.ratio) - parseFloat(jItem.ratio) ? (parseFloat(iItem.ratio) - parseFloat(jItem.ratio)).toFixed(2) : "0.00"
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
                    }
                }
                
            }
            // 最新一期的机构，把对应的管理人筛选出来
            let managerType = {}
            for(let i = 0, iLen = allTableData[0].length; i < iLen; ++i) {
                let iItem = allTableData[0][i]
                let manager = findWhichCharacter(iItem.nature.charAt(0), iItem.name, true)
                if (manager) {
                    if (Object.keys(managerType).includes(manager)) {
                        managerType[manager].push(iItem)
                    } else {
                        managerType[manager]= []
                        managerType[manager].push(iItem)
                    }
                }
            }
            // 如果没有找到一个管理人，就是所有的股东都没有找到对应的管理人
            if (Object.keys(managerType).length === 0) {
                return
            }
            // 管理人
            let managerPeople = []
            // 把每个管理人管理了多少基金的和求出来
            for (let manager in managerType) {
                if (managerType.hasOwnProperty(manager)) {
                    let obj = {
                        key: "合计",
                        name: "合计",
                        nature: "",
                        amount: 0,
                        ratio: 0,
                        amountChange: 0,
                        ratioChange: 0 
                    }
                    managerType[manager].forEach(item => {
                        obj.amount += item.amount
                        obj.ratio += parseFloat(item.ratio)
                        obj.amountChange += item.amountChange
                        obj.ratioChange += parseFloat(item.ratioChange)
                    })
                    obj.ratio = obj.ratio ? obj.ratio.toFixed(2) : "0.00"
                    obj.ratioChange = obj.ratioChange ? obj.ratioChange.toFixed(2): "0.00"
                    managerPeople.push({
                        people: manager,
                        change: obj.amountChange,
                        num: managerType[manager].length
                    })
                    managerType[manager].push(obj)
                }
            }
            // 根据管理人下面有多少个基金排序
            // console.log("managerType", managerType)
            setManagerData(managerType) 
            managerPeople = managerPeople.sort(sortByNum)
            // console.log("managerPeople", managerPeople)
            managerPeople[0].choosed = true
            setManagerPeopleArr(managerPeople)
            setTableData(managerType[managerPeople[0].people])
        }
    }

    const sortByNum = (cur, pre) => {
        if (!cur || !pre) {
            return 0;
        }
        if (parseInt(cur.num) > parseInt(pre.num)) {
            return -1;
        } else if (parseInt(cur.num) < parseInt(pre.num)) {
            return 1;
        } else {
            return 0;
        }
    }

    const selectManagerPeople = (item, i) => {
        setCurrentIndex(i)
        setTableData(managerData[item.people])
    }

    useEffect(() => {
        // setLoadingFlag(true)
        // 首先判断有没有股东性质的基础数据，如果没有则需要获取
        // 正式环境
        let url = './resources/public/stockCharacter.xlsx'
        if (!appGlobal.readCharacterFlag) {
            // 测试环境
            // let url = path.resolve() + '\\public\\stockCharacter.xlsx'
            parseCharacterFile(url, (err, result) => {
                if (err) {
                    message.error("解析股东性质基础数据出错！")
                    return
                }
                appGlobal.characterObj = result
                appGlobal.readCharacterFlag = 1
            })
        }
        let allPeriodArr = getAllPeriod()
        setAllPeriodArr([...allPeriodArr])
        if (allPeriodArr.length > 0) {
            setPeriodValue(allPeriodArr[0])
            // setLoadingFlag(false)
            allPeriodArr.length === 1 ? handleData([allPeriodArr[0]]) : handleData([allPeriodArr[0], allPeriodArr[1]])
        }
    }, [])

    return (
        <div className="manager-type">
            <div className="manager-people">
                {
                    managerPeopleArr.map((item, i) => (
                        <div className="people-item" key= {i} onClick={() => {selectManagerPeople(item, i)}}>
                            <span style={{ color: currentIndex === i ? "#1890ff" : ""}}>{item.people}</span>
                            {
                                item.change > 0 && <Icon type="arrow-up" style={{color: "#FF6565"}} />
                            }
                            {
                                item.change < 0 && <Icon type="arrow-down" style={{color: "#1EC162"}} />
                            }
                        </div>
                        
                    ))
                }
            </div>
            <div className="period-select">
                {allPeriodArr.length > 0 && (<Dropdown overlay={renderDropdownMenu()}>
                    <Button>
                        期数: {periodValue || allPeriodArr[0]}<Icon type="down" />
                    </Button>
                </Dropdown>)}
                <Button icon="to-top" onClick={exportToExcel}>导出excel</Button>
            </div>
            <div className="holderlist-table">
                {/* <div className="fixed-table-head">
                    <div style={{width: "33%", textAlign: "left", paddingLeft: "10px"}}>股东名称</div>
                    <div style={{width: "15%"}}>股东性质</div>
                    <div style={{width: "13%"}}>机构持股数量(股)</div>
                    <div style={{width: "13%"}}>机构持股比例(%)</div>
                    <div style={{width: "13%"}}>较上期持股变动数(股)</div>
                    <div style={{width: "13%"}}>持股比例变动(%)</div>
                </div> */}
                <Table dataSource={tableData} columns={columns} pagination={false} />
            </div>
        </div>
    )
}

export default ManagerType