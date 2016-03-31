# Mason
custom language designed for BaiduIFE task36

已实现的基础语法
---

```
IF expr THEN
  # code
ELSE
  # code
END
```

```
FUNC param,... DO
  # code
END
```

简单例子
---
输出1到10

```
loop = FUNC a,b DO
  PRINT a
  # compare
  IF a+1<=b THEN
    loop a+1,b
  END
END
loop 1,10
```
