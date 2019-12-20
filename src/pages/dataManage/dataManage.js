import React, { useState, useEffect } from 'react'
import { Table, Modal, Upload, message, Icon, Progress, Select  } from 'antd'
import "./dataManage.scss"
import { parseFileName, isPeriodExist, isValidFile, importFileAndResult, getAllHolderPeriod, getHolderFilePath , getAllCreditPeriod, getCreditFilePath} from "../../utils/fileParse"
import { parseT1235File } from "../../utils/excelParse"
import { sortPeriodByFileInfo, formatNumber, getHolderByType, sortHolderAmount } from "../../utils/common"

const fs = window.require("fs")
const confirm = Modal.confirm
const { Option } = Select
const path = window.require("path")

const DataManage = () => {
    const [ fileData, setFileData ] = useState([])
    const [ pagination, setPagination ] = useState({defaultCurrent: 1, total: 0, defaultPageSize: 6})
    const [ progressShow, setProgressShow] = useState(false)
    const [ progressNum, setProgressNum ] = useState(0)
    const [ visible, setVisible ] = useState(false)
    const [ holderListArr, setHolderListArr ] = useState([])
    // 编辑时的原始数据
    const [ originData, setOriginData] = useState({})

    const columns = [
        {
            title: '序号',
            dataIndex: 'key',
            key: 'key',
            width: "8%"
        },
        {
            title: '股东期数',
            dataIndex: 'period',
            key: 'period'
        }, 
        {
            title: '数据文件',
            dataIndex: 'file',
            key: 'file'
        }, 
        {
            title: '总股东数(户)',
            dataIndex: 'total_account',
            key: 'total_account'
        }, 
        {
            title: '机构股东数(户)',
            dataIndex: 'org_account',
            key: 'org_account'
        }, {
            title: '信用股东数(户)',
            dataIndex: 'credit_account',
            key: 'credit_account'
        }, 
        {
            title: '操作',
            key: 'action',
            render: (text, record) => {
                return (
                    <div>
                        <span onClick={() => editFile(record)} style={{ color: '#3B86FF', cursor: 'pointer', "marginRight": "10px" }}>编辑</span>
                        <span onClick={() => deleteFile(record)} style={{ color: '#3B86FF', cursor: 'pointer' }}>删除</span>
                    </div>
                )
            },
        }
    ]

    const listColumns = [
        {
            title: '排名',
            dataIndex: 'rank',
            width: 80
        }, 
        {
            title: '股东名称',
            dataIndex: 'name',
            align: 'left',
            width: 350,
            ellipsis: true
        }, 
        {
            title: '持股数量（股）',
            dataIndex: 'amount',
            align: 'center',
            render: (text) => {
                return (
                    <span>{formatNumber(text)} </span>
                )
            }
        }, 
        {
            title: '持股比例（%）',
            dataIndex: 'ratio',
            align: 'center',
            render: text => <span>{text ? parseFloat((text * 1).toFixed(2)) : "0.00"}</span>
        }, 
        {
            title: '股东性质',
            dataIndex: "charactor",
            className: "charactor",
            width: 240,
            render: (text, record, index) => {
                return (
                    record.editFlag ?
                    <Select defaultValue={text} style={{ width: "100%" }} onChange={(value) => {handleChange(value, index)}}>
                        <Option value="1001">牛散</Option>
                        <Option value="1000">个人</Option>
                        <Option value="2001">社保基金</Option>
                        <Option value="2002">证金公司</Option>
                        <Option value="2003">QFII</Option>
                        <Option value="2004">一般机构法人</Option>
                        <Option value="2005">信托产品</Option>
                        <Option value="2006">证券投资基金</Option>
                        <Option value="2007">基金</Option>
                        <Option value="2000">机构</Option>
                    </Select>
                    :
                    <span className="set-charactor" onClick={() => {toggle(index)}}>{getHolderByType(text)}</span>
                )
            }
        }
    ]
    const addFile = (info) => {
        // setProgressShow(true)
        let fileInfo = parseFileName(info.file.path)
        console.log("fileInfo", fileInfo)
        // 检测文件名称是否合法 isValidFile(fileInfo) 是否 包含 t1、t2、t3、t4、t5
        if (!isValidFile(fileInfo)) {
            message.error('无效股东名册文件，请重新选择!')
            return
        }
        // 检测是否符合导入规则，t1 t2 t3同一期只能导入一个文件，t5同一期只能有一个文件
        if (isPeriodExist(fileInfo)) {
            message.error('不能重复导入，请删除旧文件!')
            return
        }
        parseT1235File(fileInfo, function (err, progress, result) {
            if (err) {
                message.error('解析数据出错了，请重新导入')
                return
            }
            // 更新导入进度
            // setProgressNum(progress)
            // 导入完成了
            // if (progress === 100) {
                // 保存源文件和分析结果
                importFileAndResult(fileInfo, result, function (err) {
                    console.log("result", result)
                    if (!err) {
                        message.success('导入完成')
                        let newData = [...fileData]
                        newData.push({
                            period: result.period,
                            file: result.filename,
                            path: result.path,
                            total_account: result.total_account,
                            org_account: result.org_account,
                            credit_account: result.credit_account,
                            file_type: result.file_type
                        });
                        // 文件排序
                        newData.sort(sortPeriodByFileInfo)
                        // 重置序号
                        for (let i = 0; i < newData.length; i++) {
                            newData[i].key = i + 1
                        }
                        setFileData([...newData])
                        setPagination({ ...pagination, total: newData.length})
                        setProgressNum(0)
                        setProgressShow(false)
                    } else {
                        message.error(err.message)
                    }
                })
            // }
        })
    }

    const deleteFile = (record) => {
        confirm({
            title: '提示',
            content: '确定删除该条股东数据文件吗?',
            centered: true,
            cancelText: '取消',
            okText: '确定',
            onOk() {
                let temp = [...fileData]
                let achor = -1
                for (let i = 0; i < temp.length; i++) {
                    const item = temp[i]
                    if (item.file === record.file) {
                        achor = i
                        break
                    }
                }
                if (achor > -1) {
                    temp.splice(achor, 1)
                }
                temp.sort(sortPeriodByFileInfo)
                setFileData([...temp])
                setPagination({ ...pagination, total: temp.length})
                // 删除文件本身
                try {
                    let dir = record.path.substr(0, record.path.lastIndexOf('\\'));
                    fs.unlinkSync(record.path);
                    fs.unlinkSync(dir + '\\result.json');
                } catch (e) {
                    console.warn('clickDel unlinkSync', e);
                }
            },
            onCancel() { }
        })
    }

    const editFile = (record) => {
        setVisible(true)
        // 获取股东列表
        let holderlist = []
        if(record.file_type !== "t5") {
            holderlist = getHolderFilePath(record.period, true)
        } else {
            holderlist = getCreditFilePath(record.period, true, true)
        }
        let arr = []
        if (holderlist) {
            holderlist.recorders = holderlist.recorders.sort(sortHolderAmount)
            setOriginData(holderlist)
            holderlist.recorders.forEach((item, i) => {
                arr.push({
                    key: i + 1,
                    rank: i + 1,
                    name: item.holder_name,
                    amount: item.holder_amount,
                    ratio: item.holder_ratio,
                    charactor: item.holder_type,
                    editFlag: false
                })
            })
            setHolderListArr(arr)
        }
    }

    const toggle = (index) => {
        let tableArr = [...holderListArr]
        tableArr.forEach(item => item.editFlag = false)
        tableArr[index].editFlag = !tableArr[index].editFlag
        setHolderListArr(tableArr)
    }

    const handleCancel = () => {
        setVisible(false)
    }

    const handleChange = (value, index) => {
        let tableArr = [...holderListArr]
        tableArr[index].charactor = value
        tableArr[index].editFlag = false
        setHolderListArr(tableArr)
        // 把存储的result.json进行更新
        let originDataCopy = { ...originData }
        originDataCopy.recorders[index].holder_type = value
        let url =  path.dirname(originDataCopy.path) + "\\result.json"
        fs.writeFileSync(url, JSON.stringify(originDataCopy))
    }
    // 初始化数据,即从已经导入的文件中读取需要的数据
    const init = () => {
        // 所有导入文件的路径
        let allFileInfo = []
        let holders = getAllHolderPeriod()
        for (let i = 0; i < holders.length; i++) {
            let result = getHolderFilePath(holders[i], true)
            if (result != null) {
                allFileInfo.push(result)
            }
        }
        let credits = getAllCreditPeriod()
        for (let i = 0; i < credits.length; i++) {
            let result = getCreditFilePath(credits[i], true, true)
            if (result != null) {
                allFileInfo.push(result)
            }
        }
        // 文件排序
        allFileInfo.sort(sortPeriodByFileInfo)
        let key = 1
        let allFileInfoArr = []
        for (let info of allFileInfo) {
            allFileInfoArr.push({
                key: key,
                path: info.path,
                period: info.period,
                file: info.filename,
                total_account: info.total_account,
                org_account: info.org_account,
                credit_account: info.credit_account,
                file_type: info.file_type
            })
            key++
        }
        setFileData([...allFileInfoArr])
        setPagination({ ...pagination, total: allFileInfoArr.length})
    }

    useEffect(() => {
        init()
    }, [])

    return (
        <div className="data-manage">
            <div className="upload">
                <div className="left">
                    {
                        <Upload showUploadList={false} customRequest={addFile}>
                            {
                                // progressShow ? 
                                // <Progress strokeColor="#3B86FF" strokeWidth={7} width={140} type="circle" format={percent => `${percent} %`} percent={progressNum} />
                                // : 
                                <div className="upload-text">
                                    <Icon type="plus" style={{color: "#3B86FF", fontSize: "18px"}} /><span>导入数据</span>
                                </div>
                            }
                        </Upload>
                    }
                </div>
                <div className="right">
                    <h3 className="instructions">导入说明:</h3>
                    <p>1、请导入从中登公司下载的股东数据文件 </p>
                    <p>2、当前仅支持excel格式的股东数据文件单个导入</p>
                    <p>3、请勿导入非本公司的股东数据</p>
                    <p>4、导入文件命名示范：t16001500320180322t50.322</p>
                    {/* t1+699999+03+20150604+all.702，t1 为接口前缀，699999 为证券代码，03 为流通类型（此处为全部证券类型），20150604 为权益登记日，all 为全体股东名册，后缀 702 表示发送日期 */}
                    <h3 className="instructions">安全声明:</h3>
                    <p>1、导入的股东数据只能在本机使用，不会上传服务器</p>
                    <p>2、为了股东数据的安全，建议您断网使用股东分析系统</p>
                </div>
            </div>
            <div className="divider-line" />
            <div className="import-title">已导入文件</div>
            <div className="import-file">
                <Table dataSource={fileData} columns={columns} pagination={pagination}  />
            </div>
            <Modal
                visible={visible}
                footer={null}
                onCancel={handleCancel}
                width={1000}>
                <div className="list-title">股东列表</div>
                <Table scroll={{ y: 650 }} dataSource={holderListArr} columns={listColumns} pagination={false} />
            </Modal>

        </div>
    )
}

export default DataManage