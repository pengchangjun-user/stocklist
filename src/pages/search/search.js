import React, { useState, useEffect } from 'react'
import "./search.scss"
import { Row, Col, Input, Select, Button, Tooltip, Table , Modal, message } from "antd"
import { holderTypes } from "../../utils/common"
import { getAllPeriod, getAllData, getGroupFilePath } from "../../utils/fileParse"
import { sortHolderAmount, formatNumber, getHolderByType, strlen } from "../../utils/common"
import { Link } from 'react-router-dom'
import useKeyPress from "../../hooks/useKeyPress"

const InputGroup = Input.Group
const { Option } = Select


const Search = () => {
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
    // 选择的最新日期
    const [ periodValue, setPeriodValue ] = useState("")
    let periodValueCopy = periodValue
    // 所有日期
    const [ allPeriodArr, setAllPeriodArr ] = useState([])
    // 临时存放数据 copy
    let allPeriodArrCopy = allPeriodArr
    const [ dataSource, setDataSource ] = useState([])

    const [ allHolders, setAllHolders ] = useState([])
    const [ pagination, setPagination ] = useState({defaultCurrent: 1, total: 0, defaultPageSize: 12})

    // 引入公共hooks -- 当点击enter键盘的时候触发
    const enterPressed = useKeyPress(13)

    const columns = [{
        title: '股东名称',
        dataIndex: 'holder_name',
        width: 200,
        render: (text, record, index) => {
            var data = { name: text, period: allPeriodArr[0], idNumber: record.id_number, type: 2, holderType: record.holder_type }
            var path = {
                pathname: '/detail',
                query: data,
            }
            if (strlen(text) * 8 > 200) {
                return (
                    <Tooltip title={text}>
                        <Link to={path}><span>{text.slice(0, 10) + '...'}</span></Link>
                    </Tooltip>
                )
            } else {
                return (
                    <Link to={path}><span>{text}</span></Link>
                )
            }
        }
        }, {
            title: '股东性质',
            dataIndex: 'holder_type',
            align: 'right',
            render: text => {
                return getHolderByType(text)
            }
        }, {
            title: '最新出现期数',
            align: 'center',
            dataIndex: 'period'
        }, {
            title: '当前持股数量（股）',
            align: 'center',
            dataIndex: 'holder_amount',
            render: text => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        }, {
            title: '当前持股比例（%）',
            align: 'center',
            dataIndex: 'holder_ratio',
            render: text => {
                return text.toFixed(2)
            }
        }, {
            title: '联系电话',
            align: 'center',
            dataIndex: 'phone',
            render: (text) => {
                return text ? text : '-'
            }
        }, {
            title: '通讯地址',
            align: 'right',
            ellipsis: true,
            width: 250,
            dataIndex: 'address',
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

    const periodChange = (value) => {
        periodValueCopy = value
        setPeriodValue(value)
    }

    const search = () => {
        let arr = allHolders.slice()
        // 股东性质
        if (holderTypeValueCopy) {
            arr = arr.filter(item => {
                return item.holder_type == holderTypeValue
            })
        }
        // 筛选股东分组
        if (groupIdNumbersCopy.length > 0) {
            arr = arr.filter(item => {
                return groupIdNumbersCopy.includes(item.id_number)
            })
        }
        // 筛选股东名称
        if (holderNameValueCopy) {
            arr = arr.filter(item => {
                return item.holder_name.includes(holderNameValue)
            })
        }
        // 最新期数
        if (periodValueCopy) {
            arr = arr.filter(item => {
                return item.period === periodValueCopy
            })
        }
        setDataSource(arr)
        setPagination({ ...pagination, total: arr.length})
    }

    const reset = () => {
        setHolderNameValue("")
        setHolderTypeValue("")
        setPeriodValue("")
        setGroupName("")
        setGroupIdNumbers([])
        // 因为改变状态是异步的，所以这么写
        holderNameValueCopy = ""
        holderTypeValueCopy = ""
        periodValueCopy = ""
        groupIdNumbersCopy = []
        search()
    }
    
    const getGroups = () => {
        let groups = getGroupFilePath()
        if (groups) {
            groups = JSON.parse(groups)
        } else {
            groups = []
        }
        setGroupArr(groups)
    }

    // 获取所有期数的股东数，进行合并
    const getAllHolders = () => {
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
            }
        }
        let allHolders = []
        let holderObj = {}
        for (let i = 0; i < allPeriodArrCopy.sort().length; ++i) {
            let arr = allData[allPeriodArrCopy[i]]
            for (let j = 0; j < arr.length; ++j) {
                if (!holderObj[arr[j].id_number]) {
                    holderObj[arr[j].id_number] = true
                    arr[j].period = allPeriodArrCopy[i]
                    allHolders.push(arr[j])
                } else {
                    // 如果已经存在，那么需要更换成最新一期的数据
                    allHolders = replaceOld(allHolders, arr[j])
                }
            }
        }
        allHolders.forEach((item, i) => {
            item.key = i + 1
        })
        console.log("allHolders", allHolders)
        setAllHolders(allHolders)
        setDataSource(allHolders)
        setPagination({ ...pagination, total: allHolders.length})
    }

    const replaceOld = (data, item) => {
        let arr = data.slice()
        for(let i = 0; i < data.length; ++i) {
            if (data[i].id_number === item.id_number) {
                let obj = { ...item, period: data[i].period}
                arr.splice(i, 1, obj)
                break
            }
        }
        return arr
    }

    useEffect(() => {
        if (enterPressed) {
            search()
        }
    })

    useEffect(() => {
        let allPeriodArr = getAllPeriod()
        allPeriodArrCopy = allPeriodArr
        setAllPeriodArr([...allPeriodArr])
        getGroups()
        if (allPeriodArr.length > 0) {
            getAllHolders()
        } else {
            message.warn('您还未上传股东名册数据，请先上传数据！')
        }
    }, [])

    return (
        <div className="search">
            <Row className="row" gutter={16}>
                <Col className="gutter-row" span={12}>
                    <Input size="large" placeholder="股东名称" value={holderNameValue} onChange={holderNameInputChange} addonBefore="股东名称" />
                </Col>
                <Col className="gutter-row" span={12}>
                    <InputGroup compact className="input-group-style">
                        <div className="input-select-head">股东分组</div>
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
                        <div className="input-select-head">最新出现期数</div>
                        <Select className="input-select-style" allowClear placeholder="请选择最新出现期数" value={periodValue} onChange={periodChange}>
                            {allPeriodArr.map(period => <Option key={period}>{period}</Option>)}
                        </Select>
                    </InputGroup>
                </Col>
                <Col className="gutter-row" span={3} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button style={{ height: 40, width: 80, marginLeft: 10 }} type='primary' onClick={search}>搜索</Button>
                    <Button style={{ height: 40, width: 80, marginLeft: 10 }} onClick={reset}>重置</Button>
                </Col>
            </Row>
            <Table dataSource={dataSource} columns={columns} pagination={pagination} />
        </div>
    )
}

export default Search