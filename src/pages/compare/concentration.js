import React, { useState, useEffect } from "react"
import "./concentration.scss"
import PeriodCompare from "../../components/periodCompare"
import { getAllPeriod, getAllData, setControlFilePath, getControlFilePath } from "../../utils/fileParse"
import { sortHolderAmount, formatNumber, getHolderByType, onExportToExcel } from "../../utils/common"
import { Table, Button, Modal, Checkbox, message, Icon } from "antd"


const Concentration = (props) => {
	// 选中展开的行
	const [rowIndex, setRowIndex] = useState([])
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
    const [levelData, setLevelData] = useState([])
    // 所有日期的股东持股数据
	const [allData, setAllData] = useState({})
	// 弹框--控股股东的id
	const [ idNumbers, setIdNumbers ] = useState([])
	let idNumbersCopy = idNumbers
	// 弹框--控股股东的数据
	const [ holderSetArr, setHolderSetArr] = useState([])
	// 是否设置了控股股东
	let noControlHolder = true
	

	const [visible, setVisible] = useState(false)
	const [settingVisible, setSettingVisible] = useState(false)

	const showExport = true
	
	const leftFixedColumns = [
        {
            title: '股东层级',
            dataIndex: 'level',
			key: 'level',
			render: (text, record) => {
				return (
					record.key === "1" ? <span>{text} <Icon onClick={setControl} style={{marginLeft: "4px", cursor: "pointer"}} type="setting" /></span> : <span>{text}</span>
				)
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

	const setColumns = [{
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
            title: '控股股东',
            dataIndex: 'idNumber',
            align: 'center',
            render: text => {
                return <Checkbox checked={idNumbers.includes(text)} onChange={() => {
                    checkChange(text)
                }} />
            }
        }
    ]
	
	const setControl = () => {
		setSettingVisible(true)
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
	
	const handleSetOk = () => {
		allPeriodArr.forEach(item => {
			// 把每一期都写一个控股股东的文件
			setControlFilePath(item, idNumbers)
		})
		setSettingVisible(false)
		handleData(selectPeriod, allData)
	}
	const handleSetCancel = () => {
		setSettingVisible(false)
	}

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
	
	const handleData = (selectPeriod, allData) => {
        if (selectPeriod.length === 0) {
            setCompareTables([])
            return
        }
		// 把左侧固定的表格整理出来
		let compareTables = []
		let firstData = allData[selectPeriod[0]]
        let levelData = [
			{key : "1", level: "控股股东", childrenArr: []},
			{key : "2", level: "前10名股东", childrenArr: ["机构股东", "自然人股东"]},
			{key : "3", level: "前20名股东", childrenArr: ["机构股东", "自然人股东"]},
			{key : "4", level: "前30名股东", childrenArr: ["机构股东", "自然人股东"]},
			{key : "5", level: "前50名股东", childrenArr: ["机构股东", "自然人股东"]},
			{key : "6", level: "前100名股东", childrenArr: ["机构股东", "自然人股东"]}
		]
		// 如果没有设置控股股东
		firstData.forEach(item => {
			if (idNumbersCopy.includes(item.id_number)) {
				levelData[0].childrenArr.push(item.holder_name)
			}
		})
 		// 整理对比期的数据
		for (let i = 0; i < selectPeriod.length; ++i) {
			let period = selectPeriod[i]
			let data = []
			for (let m = 0; m < levelData.length; ++m) {
				let lItem = levelData[m]
				let obj = {}
				if (lItem.level === "控股股东") {
					obj = { key: m + 1 + "", amount: 0, ratio: 0, number:0, childrenArr: [] }
				} else {
					obj = {
						key: m + 1 + "", amount: 0, ratio: 0,
						childrenArr: [
							// 机构
							{ key: "org", amount: 0, ratio: 0, number: 0 },
							// 个人
							{ key: "personal", amount: 0, ratio: 0, number: 0 }
						]
					}
				}
				for (let j = 0; j < allData[period].length; ++j) {
					let dItem = allData[period][j]
					// 控股股东
					if (lItem.level === "控股股东") {
						// 如果没有设置控股股东
						if (idNumbersCopy.includes(dItem.id_number)) {
							obj.amount += dItem.holder_amount
                            obj.ratio += parseFloat(parseFloat(dItem.holder_ratio).toFixed(2))
                            obj.number ++
							obj.childrenArr.push({
								key: "control" + j,
								amount: dItem.holder_amount,
								ratio: parseFloat(parseFloat(dItem.holder_ratio).toFixed(2))
							})
						}
					}
					// 前10名 --没有户数
					if (lItem.level === "前10名股东") {
						if (j < 10) {
							obj = clearData(obj, dItem)
						}
					}
					// 前20名 --没有户数
					if (lItem.level === "前20名股东") {
						if (j < 20) {
							obj = clearData(obj, dItem)
						}
					}
					// 前30名 --没有户数
					if (lItem.level === "前30名股东") {
						if (j < 30) {
							obj = clearData(obj, dItem)
						}
					}
					// 前50名 --没有户数
					if (lItem.level === "前50名股东") {
						if (j < 50) {
							obj = clearData(obj, dItem)
						}
					}
					// 前100名 --没有户数
					if (lItem.level === "前100名股东") {
						if (j < 100) {
							obj = clearData(obj, dItem)
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
		for (let w = 0; w < compareTables.length; ++w) {
            let ratioChange = "0.00"
             // 如果是最后一项
             if (w === compareTables.length - 1) {
                compareTables[w].data.forEach(item => {
                    item.ratioChange = ratioChange
					item.ratio = item.ratio ? parseFloat(item.ratio).toFixed(2) : "0.00"
					// 还有机构和个人的占比变化
					item.childrenArr.forEach(cItem => {
						cItem.ratioChange = ratioChange
						cItem.ratio = cItem.ratio ? parseFloat(cItem.ratio).toFixed(2) : "0.00"
					})
                })
            } else {
                let currentItem = compareTables[w]
                let preItem = compareTables[w + 1]
                currentItem.data.forEach((item, q) => {
                    let ratio1 = (item.ratio - preItem.data[q].ratio).toFixed(2)
                    item.ratioChange = ratio1 ? ratio1 : "0.00"
					item.ratio = item.ratio ? parseFloat(item.ratio).toFixed(2) : "0.00"
					// 机构和个人占比变化
					item.childrenArr.forEach((cItem, c) => {
						let ratio1 = (cItem.ratio - preItem.data[q].childrenArr[c].ratio).toFixed(2)
						cItem.ratioChange = ratio1 ? ratio1 : "0.00"
						cItem.ratio = cItem.ratio ? parseFloat(cItem.ratio).toFixed(2) : "0.00"
					})
                })
            }
		}
        setCompareTables(compareTables)
        setLevelData(levelData)
    }
    
    const exportToExcel = () => {
        if (rowIndex.length > 0) {
            message.warn("请先关闭展开的子表格，该版本不支持子表格的导出！")
            return
        }
        onExportToExcel("股东层级", selectPeriod, "集中度对比")
    }

	const expand = (expanded, record) => {
		if (!expanded) {
			let index = rowIndex.findIndex(item => item === record.key)
			rowIndex.splice(index, 1)
			setRowIndex([...rowIndex])
		} else {
			rowIndex.push(record.key)
			setRowIndex([...rowIndex])
		}
	}

	const expandedRowRenderLevel = (record) => {
		const columns = [
			{
				title: '股东层级',
            	dataIndex: 'level',
            	key: 'level'
			}
		]
		let data = []
		if (record.key === "1") {
			record.childrenArr.forEach((item, i) => {
				data.push({
					key: "control" + i, level: record.childrenArr[i]
				})
			})
		} else {
			data = [
				{ key: "org", level: "机构股东" },
				{ key: "personal", level: "自然人股东" }
			]
		}
		return <Table columns={columns} dataSource={data} showHeader={false} pagination={false} />
	}

	const expandedRowRender = (record) => {
		const columns = [
			{ title: '股东数量(户)', dataIndex: 'number', key: 'number', align: "center", width: 100 },
			{ title: '持股数量(股)', dataIndex: 'amount', key: 'amount',  align: 'center', width: 101, render: text => <span>	{formatNumber(text)} </span>},
			{ title: '持股比例(%)', dataIndex: 'ratio', key: 'ratio',  align: 'center', width: 99},
            { title: '较上期持股比例变动(%)', dataIndex: 'ratioChange', key: 'ratioChange',  align: 'center', width: 171, render: text => <span style={{color: text > 0 ? "#FF6565" : (text < 0 ? "#1EC162" : "")}}>{text > 0 ? "+" : ""}{text}</span>}
		]
		const data = record.childrenArr
		return <Table columns={columns} dataSource={data} showHeader={false} pagination={false} />
	}

	const clearData = (obj, dItem) => {
		obj.amount += dItem.holder_amount
		obj.ratio += parseFloat(parseFloat(dItem.holder_ratio).toFixed(2))
		// 刷选出机构和个人
		if (String(dItem.holder_type).charAt(0) === '2' || String(dItem.holder_type) === "机构") {
			obj.childrenArr[0].amount += dItem.holder_amount
			obj.childrenArr[0].ratio += parseFloat(parseFloat(dItem.holder_ratio).toFixed(2))
			obj.childrenArr[0].number ++
		} else {
			obj.childrenArr[1].amount += dItem.holder_amount
			obj.childrenArr[1].ratio += parseFloat(parseFloat(dItem.holder_ratio).toFixed(2))
			obj.childrenArr[1].number ++
		}
		return obj
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
			// 获取所有期数的数据
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
                        idNumber: mItem.id_number
                    }
                    holderSetArr.push(obj)
                }
                setHolderSetArr(holderSetArr)
            }
            // 默认展示最新两期的数据
            let selectPeriod = allPeriodArrCopy.length === 1 ? [allPeriodArrCopy[0]] : [allPeriodArrCopy[0], allPeriodArrCopy[1]]
			setSelectPeriod([...selectPeriod])
			// 获取控股股东
			let controlHolder = JSON.parse(getControlFilePath(allPeriodArrCopy[0]))
			if (Array.isArray(controlHolder) && controlHolder.length > 0) {
				console.log("controlHolder", controlHolder)
				idNumbersCopy = controlHolder
				setIdNumbers(controlHolder)
			} else {
				// 默认把最新一期的持股数最高的设置为控股股东
				let arr = [allData[allPeriodArrCopy[0]][0].id_number]
				setIdNumbers(arr)
				idNumbersCopy = arr
			}
			handleData(selectPeriod, allData)
			
        } else {
            message.warn('您还未上传股东名册数据，请先上传数据！')
        }
	}, [])



	return (
		<div className="concentration">
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
							<Table
								onExpand = {expand}
								expandedRowKeys={rowIndex}
								expandedRowRender={expandedRowRenderLevel} 
								columns={leftFixedColumns}  
								dataSource={levelData} 
								pagination={false} 
							/>
                        </div>
                        <div className="right-scroll">
                            <div className="right-content" style={{width: `${compareTables.length * 520}px`}}>
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
											<Table
												onExpand = {expand}
												expandIcon={() => <span style={{display: "none"}}></span>}
												expandedRowKeys={rowIndex}
												expandedRowRender={expandedRowRender}  
												columns={tableColumns}
												dataSource={item.data}
												pagination={false} 
											/>
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
			<Modal
                okText="完 成"
                cancelText="取 消"
                visible={settingVisible}
                onOk={handleSetOk}
                onCancel={handleSetCancel}
                width={1000}>
                <div className="set-control-title">控股股东设置</div>
                <div className="set-dec">系统默认选择持股比例最大的股东为控股股东，可自由勾选设置控股股东</div>
                <Table dataSource={holderSetArr} columns={setColumns} />
            </Modal>
		</div>
	)
}

export default Concentration